const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Bill = require("../models/Bill");
const GiftCard = require("../models/GiftCard");
const { sendEmail, sendVerificationCodeEmail, sendTransactionAlert } = require("../services/emailService");
const { sendOTP, sendTransactionAlert: sendSMSAlert } = require("../services/customNotificationService");
const axios = require("axios");
const crypto = require("crypto");

/**
 * Create a new transaction
 * @param {Object} req.body
 *   type: string - qr_payment, normal_transfer, airtime, data, electricity, schoolfees, transport, international_transfer etc.
 *   amount: number
 *   receiverId?: string
 *   receiverName?: string
 *   receiverAccountNumber?: string
 *   receiverBank?: string
 *   description?: string
 *   metadata?: object
 */
const createTransaction = async (req, res) => {
  try {
    const { 
      type,
      amount,
      receiverId,
      receiverName,
      receiverAccountNumber,
      receiverBank,
      receiverCountry = "NG",
      receiverCurrency = "NGN",
      description,
      metadata,
      qrData,
      reference,
      merchantId
    } = req.body;

    const senderId = req.user._id;
    const sender = await User.findById(senderId).populate('wallet');
    const senderWallet = await Wallet.findOne({ user: senderId });

    if (!senderWallet) {
      return res.status(400).json({ 
        success: false, 
        message: 'No wallet found for sender' 
      });
    }

    if (senderWallet.balance < amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient balance' 
      });
    }

    // Generate reference if not provided
    const txRef = reference || `TXN-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Create transaction record (pending initially)
    const transaction = new Transaction({
      sender: senderId,
      receiver: receiverId || null,
      receiverName,
      receiverAccountNumber,
      receiverBank,
      receiverCountry,
      receiverCurrency,
      exchangeRate: 1,
      type,
      amount,
      qrData,
      reference: txRef,
      merchantId,
      description,
      status: "pending"
    });

    await transaction.save();

    // Execute transaction based on type
    let receiverWallet = null;
    let transactionStatus = 'success';
    let executed = false;

    try {
      switch (type) {
        case 'qr_payment':
        case 'normal_transfer':
        case 'merchant_payment':
        case 'payment_url':
          // Internal transfer between AmstaPay users
          if (!receiverId) {
            throw new Error('receiverId is required for internal transfers');
          }
          receiverWallet = await Wallet.findOne({ user: receiverId });
          if (!receiverWallet) {
            receiverWallet = await Wallet.create({ user: receiverId, balance: 0 });
          }
          senderWallet.balance -= amount;
          receiverWallet.balance += amount;
          executed = true;
          break;

        case 'airtime':
        case 'data':
        case 'electricity':
        case 'schoolfees':
        case 'transport':
        case 'tv':
        case 'cable':
          // Bill payments - handled by billsController but can also be created here
          // Deduct from wallet immediately
          senderWallet.balance -= amount;
          transaction.status = 'success';
          executed = true;
          
          // Create bill record if not exists
          // (billsController would have already created it, this is fallback)
          break;

        case 'fund':
          // Wallet funding - add to wallet
          senderWallet.balance += amount;
          transaction.status = 'success';
          executed = true;
          break;

        case 'withdraw':
          // Withdrawal - deduct from wallet
          senderWallet.balance -= amount;
          transaction.status = 'success';
          executed = true;
          break;

        case 'international_transfer':
          // International transfers go through Paystack/other providers
          // Debit sender immediately, credit when confirmed via webhook
          senderWallet.balance -= amount;
          transaction.status = 'pending'; // will be updated by webhook
          executed = true;
          break;

        case 'web3_deposit':
          // Crypto deposit - credits pending until confirmed
          transaction.status = 'pending';
          executed = false; // no immediate balance change
          break;

        case 'web3_withdrawal':
          // Crypto withdrawal - deduct equivalent fiat value if linked to wallet
          senderWallet.balance -= amount;
          transaction.status = 'processing';
          executed = true;
          break;

        case 'crypto_payment':
          // Crypto to fiat conversion
          senderWallet.balance += amount; // user receives fiat
          transaction.status = 'success';
          executed = true;
          break;

        default:
          return res.status(400).json({ 
            success: false, 
            message: `Unsupported transaction type: ${type}` 
          });
      }

      // Save wallet changes if executed
      if (executed) {
        await senderWallet.save();
        if (receiverWallet) {
          await receiverWallet.save();
        }
      }

      // Mark transaction as successful if applicable
      if (['qr_payment', 'normal_transfer', 'merchant_payment', 'payment_url', 'fund', 'withdraw', 'crypto_payment'].includes(type)) {
        transaction.status = 'success';
      }
      await transaction.save();

      // Create ledger entry (for enhanced wallet tracking)
      if (senderWallet.ledger) {
        senderWallet.ledger.push({
          type: 'debit',
          amount,
          transaction: transaction._id,
          description: description || `${type} transaction`
        });
        await senderWallet.save();
      }

      if (receiverWallet && receiverWallet.ledger) {
        receiverWallet.ledger.push({
          type: 'credit',
          amount,
          transaction: transaction._id,
          description: `Received from ${sender.fullName}`
        });
        await receiverWallet.save();
      }

      // Notify both parties
      await sendTransactionAlert({
        userId: senderId,
        email: sender.email,
        phone: sender.phoneNumber,
        transaction: {
          ...transaction.toObject(),
          status: transaction.status
        }
      });

      if (receiverId) {
        const receiver = await User.findById(receiverId);
        if (receiver) {
          await sendTransactionAlert({
            userId: receiverId,
            email: receiver.email,
            phone: receiver.phoneNumber,
            transaction: {
              ...transaction.toObject(),
              status: transaction.status
            }
          });
        }
      }

      res.status(201).json({ 
        success: true, 
        message: 'Transaction created successfully',
        data: {
          transaction,
          balance: senderWallet.balance
        }
      });

    } catch (execError) {
      // Transaction failed - mark as failed
      transaction.status = 'failed';
      transaction.error = execError.message;
      await transaction.save();
      
      throw execError;
    }

  } catch (err) {
    console.error("Transaction creation error:", err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create transaction', 
      error: err.message 
    });
  }
};

const getTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      type, 
      status, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 20 
    } = req.query;

    const filter = { 
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    };

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filter)
      .populate("sender", "fullName email amstapayAccountNumber")
      .populate("receiver", "fullName email amstapayAccountNumber")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Transaction.countDocuments(filter);

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      transactions
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch transactions", 
      error: err.message 
    });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("sender", "fullName email amstapayAccountNumber")
      .populate("receiver", "fullName email amstapayAccountNumber");

    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        message: "Transaction not found" 
      });
    }

    // Ensure user is involved in the transaction
    if (
      transaction.sender._id.toString() !== req.user._id.toString() &&
      (!transaction.receiver || transaction.receiver._id.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized to view this transaction" 
      });
    }

    res.json({ 
      success: true, 
      transaction 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch transaction", 
      error: err.message 
    });
  }
};

const updateTransactionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!['pending', 'processing', 'success', 'failed', 'reversed'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status" 
      });
    }

    const transaction = await Transaction.findById(id)
      .populate("sender")
      .populate("receiver");

    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        message: "Transaction not found" 
      });
    }

    const oldStatus = transaction.status;
    transaction.status = status;
    await transaction.save();

    // If completed, adjust balances
    if (status === "success" && oldStatus !== "success") {
      const senderWallet = await Wallet.findOne({ user: transaction.sender._id });
      if (senderWallet) {
        senderWallet.balance -= transaction.amount;
        await senderWallet.save();
      }

      if (transaction.receiver) {
        const receiverWallet = await Wallet.findOne({ user: transaction.receiver._id });
        if (receiverWallet) {
          receiverWallet.balance += transaction.amount;
          await receiverWallet.save();
        }
      }
    }

    // If reversed/refund
    if (status === "reversed" && oldStatus === "success") {
      const senderWallet = await Wallet.findOne({ user: transaction.sender._id });
      if (senderWallet) {
        senderWallet.balance += transaction.amount;
        await senderWallet.save();
      }
    }

    // Notify sender
    await sendEmail(
      transaction.sender.email,
      "Transaction Update",
      `Your transaction of ₦${transaction.amount} is now ${status}. Reference: ${transaction.reference}`
    );

    // Notify receiver if applicable
    if (transaction.receiver) {
      await sendEmail(
        transaction.receiver.email,
        "Transaction Update",
        `Transaction of ₦${transaction.amount} from ${transaction.sender.fullName} is now ${status}.`
      );
    }

    res.json({ 
      success: true, 
      message: "Transaction status updated", 
      transaction 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to update transaction", 
      error: err.message 
    });
  }
};

const handlePaystackWebhook = async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    
    if (!secret) {
      console.error("PAYSTACK_SECRET_KEY not configured");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const hash = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      console.error("Invalid Paystack webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const event = req.body;
    console.log("🔔 Paystack Event:", event.event, event.data);

    // Handle different event types
    const { event: eventType, data } = event;

    switch (eventType) {
      case "charge.success":
        await handleChargeSuccess(data);
        break;

      case "transfer.success":
        await handleTransferSuccess(data);
        break;

      case "transfer.failed":
      case "transfer.reversed":
        await handleTransferFailed(data);
        break;

      case "paymentrequest.pending":
      case "paymentrequest.processing":
        // Just log
        break;

      case "subscription.disable":
      case "subscription.not_renew":
        // Handle subscription cancellation
        break;

      default:
        console.log(`Unhandled Paystack event: ${eventType}`);
    }

    res.status(200).json({ received: true, event: eventType });
  } catch (err) {
    console.error("❌ Webhook Error:", err.message, err.stack);
    res.sendStatus(500);
  }
};

// Handle Paystack charge success
async function handleChargeSuccess(data) {
  const { reference, amount, currency, paid_at, customer } = data;
  
  // Find transaction by reference
  const transaction = await Transaction.findOne({ reference });
  
  if (!transaction) {
    console.log(`Transaction not found for reference: ${reference}`);
    return;
  }

  // Update transaction status
  transaction.status = "success";
  transaction.paystackResponse = data;
  
  // Update wallet for the sender
  if (transaction.sender) {
    const senderWallet = await Wallet.findOne({ user: transaction.sender });
    if (senderWallet) {
      // For bill payments, wallet was already debited
      // For top-ups/funding, credit the wallet
      if (transaction.type === 'fund' || transaction.type === 'web3_deposit') {
        senderWallet.balance += transaction.amount;
        // Add ledger entry
        if (senderWallet.ledger) {
          senderWallet.ledger.push({
            type: 'credit',
            amount: transaction.amount,
            transaction: transaction._id,
            description: `Payment via Paystack: ${reference}`
          });
        }
      }
      await senderWallet.save();
    }
  }

  await transaction.save();

  // Send notification
  await sendEmail(
    transaction.sender.email || customer?.email,
    "Payment Successful",
    `Your payment of ₦${amount/100} was successful. Reference: ${reference}`
  );
}

// Handle Paystack transfer success
async function handleTransferSuccess(data) {
  const { reference, amount, currency, completed_at } = data;
  
  const transaction = await Transaction.findOne({ 
    reference,
    type: 'international_transfer'
  });
  
  if (!transaction) {
    console.log(`Transfer transaction not found: ${reference}`);
    return;
  }

  transaction.status = 'success';
  transaction.paystackResponse = data;
  await transaction.save();

  // Notify user
  if (transaction.sender) {
    await sendEmail(
      transaction.sender.email,
      "International Transfer Successful",
      `Your international transfer of ₦${amount/100} to ${transaction.receiverName} has been completed.`
    );
  }
}

// Handle Paystack transfer failed
async function handleTransferFailed(data) {
  const { reference, amount, reason } = data;
  
  const transaction = await Transaction.findOne({ reference });
  
  if (!transaction) return;

  transaction.status = 'failed';
  transaction.paystackResponse = data;
  
  // Refund to sender's wallet
  if (transaction.sender) {
    const senderWallet = await Wallet.findOne({ user: transaction.sender });
    if (senderWallet) {
      senderWallet.balance += transaction.amount;
      if (senderWallet.ledger) {
        senderWallet.ledger.push({
          type: 'credit',
          amount: transaction.amount,
          description: `Refund for failed transaction: ${reference}`,
          transaction: transaction._id
        });
      }
      await senderWallet.save();
    }
  }

  await transaction.save();
}

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransactionStatus,
  handlePaystackWebhook
};