const crypto = require("crypto");
const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");
const Bill = require("../models/Bill");
const { sendEmail } = require("../services/emailService");
const { sendTransactionAlert } = require("../services/customNotificationService");

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

const paystackWebhook = async (req, res) => {
  try {
    if (!PAYSTACK_SECRET) {
      console.error("PAYSTACK_SECRET_KEY not configured");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const payload = JSON.stringify(req.body);
    const signature = req.headers["x-paystack-signature"];
    
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET)
      .update(payload)
      .digest("hex");

    if (hash !== signature) {
      console.error("❌ Invalid Paystack signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const { event, data } = req.body;
    console.log(`📡 Paystack Webhook: ${event}`);

    // Handle charge.success
    if (event === "charge.success") {
      await handleChargeSuccess(data);
    }

    // Handle transfer.success
    if (event === "transfer.success") {
      await handleTransferSuccess(data);
    }

    // Handle transfer.failed / transfer.reversed
    if (event === "transfer.failed" || event === "transfer.reversed") {
      await handleTransferFailed(data);
    }

    // Handle bill payment callbacks
    if (event === "bill.payment.success") {
      await handleBillPaymentSuccess(data);
    }

    // Handle bill payment failure
    if (event === "bill.payment.failed") {
      await handleBillPaymentFailed(data);
    }

    // Acknowledge receipt
    res.status(200).json({ received: true, event });
  } catch (err) {
    console.error("❌ Webhook Error:", err.message);
    res.sendStatus(500);
  }
};

// Charge success handler
async function handleChargeSuccess(data) {
  const { reference, amount, currency, customer, paid_at, channel } = data;
  
  // Find transaction
  const transaction = await Transaction.findOne({ 
    reference,
    status: { $ne: 'success' } 
  }).populate('sender');
  
  if (!transaction) {
    console.log(`Transaction not found for charge success: ${reference}`);
    return;
  }

  console.log(`✅ Charge success: ${reference} - ₦${amount/100}`);

  // Update transaction
  transaction.status = "success";
  transaction.paystackResponse = data;
  await transaction.save();

  // Handle wallet updates based on transaction type
  if (transaction.type === 'fund' || transaction.type === 'giftcard_purchase' || transaction.type === 'loan_application') {
    // No wallet debit needed - these already handled or different
    // For fund, the wallet was credited at creation time, just mark success
  } else if (transaction.type === 'airtime' || transaction.type === 'data' || 
             transaction.type === 'electricity' || transaction.type === 'schoolfees' || 
             transaction.type === 'transport') {
    // Bill payments - wallet already debited at creation, mark success
  } else {
    // Internal transfers - adjust balances
    const senderWallet = await Wallet.findOne({ user: transaction.sender });
    if (senderWallet && senderWallet.balance < transaction.amount) {
      senderWallet.balance += transaction.amount; // add back if not yet debited
    }
    if (senderWallet) await senderWallet.save();
  }

  // Send notification to user
  if (transaction.sender) {
    await sendEmail(
      transaction.sender.email,
      "Payment Successful",
      `Your payment of ₦${(amount/100).toFixed(2)} was successful. Reference: ${reference}`
    );
    
    await sendTransactionAlert({
      userId: transaction.sender._id,
      email: transaction.sender.email,
      phone: transaction.sender.phoneNumber,
      transaction: {
        ...transaction.toObject(),
        status: 'success',
        amount: transaction.amount
      }
    });
  }
}

// Transfer success handler
async function handleTransferSuccess(data) {
  const { reference, amount, currency, completed_at } = data;
  
  const transaction = await Transaction.findOne({ 
    reference,
    type: 'international_transfer'
  }).populate('sender');
  
  if (!transaction) {
    console.log(`Transfer transaction not found: ${reference}`);
    return;
  }

  console.log(`✅ Transfer successful: ${reference} to ${transaction.receiverName}`);

  transaction.status = 'success';
  transaction.paystackResponse = data;
  await transaction.save();

  // Send notification to sender
  if (transaction.sender) {
    await sendEmail(
      transaction.sender.email,
      "International Transfer Successful",
      `Your transfer of ₦${amount/100} to ${transaction.receiverName} (${transaction.receiverCountry}) has been completed.`
    );
  }
}

// Transfer failed handler
async function handleTransferFailed(data) {
  const { reference, amount, reason } = data;
  
  const transaction = await Transaction.findOne({ 
    reference,
    status: { $ne: 'failed' }
  }).populate('sender');
  
  if (!transaction) return;

  console.log(`❌ Transfer failed: ${reference} - ${reason}`);

  transaction.status = 'failed';
  transaction.error = reason;
  transaction.paystackResponse = data;
  
  // Refund sender's wallet if transfer was from AmstaPay balance
  if (transaction.sender && transaction.amount) {
    const senderWallet = await Wallet.findOne({ user: transaction.sender });
    if (senderWallet) {
      senderWallet.balance += transaction.amount;
      if (senderWallet.ledger) {
        senderWallet.ledger.push({
          type: 'credit',
          amount: transaction.amount,
          description: `Refund - Failed transfer: ${reference}`,
          transaction: transaction._id
        });
      }
      await senderWallet.save();
    }
  }

  await transaction.save();

  if (transaction.sender) {
    await sendEmail(
      transaction.sender.email,
      "Transfer Failed",
      `Your transfer of ₦${amount/100} failed. Reason: ${reason}. Amount has been refunded to your wallet.`
    );
  }
}

// Bill payment success
async function handleBillPaymentSuccess(data) {
  const { reference, amount, customer } = data;
  
  const bill = await Bill.findOne({ externalReference: reference });
  
  if (!bill) {
    console.log(`Bill not found for reference: ${reference}`);
    return;
  }

  console.log(`✅ Bill payment successful: ${reference}`);

  bill.status = 'paid';
  bill.paidAt = new Date();
  await bill.save();

  // Update related transaction
  await Transaction.findOneAndUpdate(
    { reference },
    { status: 'success' }
  );

  // Notify user
  if (bill.user) {
    await sendEmail(
      bill.user.email,
      "Bill Payment Successful",
      `Your ${bill.type} payment of ₦${amount/100} was successful.`
    );
  }
}

// Bill payment failed
async function handleBillPaymentFailed(data) {
  const { reference, amount, reason } = data;
  
  const bill = await Bill.findOne({ externalReference: reference });
  
  if (!bill) return;

  console.log(`❌ Bill payment failed: ${reference}`);

  bill.status = 'failed';
  await bill.save();

  // Refund wallet
  if (bill.user) {
    const wallet = await Wallet.findOne({ user: bill.user });
    if (wallet) {
      wallet.balance += amount / 100; // Paystack amounts are in kobo
      await wallet.save();
    }
    
    await sendEmail(
      bill.user.email,
      "Bill Payment Failed",
      `Your ${bill.type} payment failed. ₦${amount/100} has been refunded to your wallet.`
    );
  }
}

module.exports = { paystackWebhook };
