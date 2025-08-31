const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");
const { v4: uuidv4 } = require("uuid");
const {
  verifyBankAccount,
  createRecipient,
  initiateTransfer,
} = require("./paystackController");



const {
  buyAirtime,
  buyData,
  payCable,
  payElectricity,
} = require("../services/paystackService");



// Create a transaction
const createTransaction = async (req, res) => {
  try {
    const {
      type,
      amount,
      receiverAccountNumber,
      receiverBank,
      receiverId,
      qrData,
      description,
      phone,
      plan,
      provider,
      meterNumber,
    } = req.body;

    const sender = req.user;
    const reference = `AMSTA-${uuidv4()}`;

    const transaction = new Transaction({
      sender: sender._id,
      type,
      amount,
      reference,
      status: "pending",
      metadata: {
        description,
        qrData,
        receiverBank,
        receiverAccountNumber,
        phone,
        plan,
        provider,
        meterNumber,
      },
    });

    // 🔹 Wallet → Wallet
    if (type === "wallet_transfer") {
      const senderWallet = await Wallet.findOne({ user: sender._id });
      const receiverWallet = await Wallet.findOne({ user: receiverId });

      if (!senderWallet || !receiverWallet) {
        return res.status(400).json({ message: "Invalid sender/receiver wallet" });
      }
      if (senderWallet.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      senderWallet.balance -= amount;
      senderWallet.ledger.push({ type: "debit", amount, transaction: transaction._id });

      receiverWallet.balance += amount;
      receiverWallet.ledger.push({ type: "credit", amount, transaction: transaction._id });

      await senderWallet.save();
      await receiverWallet.save();

      transaction.receiver = receiverId;
      transaction.status = "success";
    }

    // 🔹 Wallet → Bank (Paystack Transfer)
    if (type === "bank_transfer") {
      const senderWallet = await Wallet.findOne({ user: sender._id });
      if (!senderWallet || senderWallet.balance < amount) {
        return res.status(400).json({ message: "Insufficient wallet balance" });
      }

      senderWallet.balance -= amount;
      senderWallet.ledger.push({ type: "debit", amount, transaction: transaction._id });
      await senderWallet.save();

      const verified = await verifyBankAccount(receiverAccountNumber, receiverBank);
      const recipient = await createRecipient(
        verified.account_name,
        receiverAccountNumber,
        receiverBank
      );
      const paystackTx = await initiateTransfer(
        amount,
        recipient.recipient_code,
        description || "AmstaPay Transfer",
        reference
      );

      transaction.metadata = { paystack: paystackTx, recipientCode: recipient.recipient_code };
      transaction.status = "processing"; // will be updated by webhook
    }

    // 🔹 QR Payments
    if (type === "qr_payment") {
      const parsedQR = JSON.parse(qrData);
      const receiverWallet = await Wallet.findOne({ user: parsedQR.userId });
      const senderWallet = await Wallet.findOne({ user: sender._id });

      if (!receiverWallet || !senderWallet) {
        return res.status(400).json({ message: "Invalid QR participants" });
      }
      if (senderWallet.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      senderWallet.balance -= amount;
      senderWallet.ledger.push({ type: "debit", amount, transaction: transaction._id });

      receiverWallet.balance += amount;
      receiverWallet.ledger.push({ type: "credit", amount, transaction: transaction._id });

      await senderWallet.save();
      await receiverWallet.save();

      transaction.receiver = receiverWallet.user;
      transaction.status = "success";
    }

    // 🔹 Airtime Purchase
    if (type === "airtime") {
      const paystackRes = await buyAirtime(phone, amount, reference);
      transaction.metadata.paystack = paystackRes;
      transaction.status = paystackRes?.status ? "success" : "failed";
    }

    // 🔹 Data Purchase
    if (type === "data") {
      const paystackRes = await buyData(phone, plan, reference);
      transaction.metadata.paystack = paystackRes;
      transaction.status = paystackRes?.status ? "success" : "failed";
    }

    // 🔹 Cable TV
    if (type === "cable") {
      const paystackRes = await payCable(receiverAccountNumber, provider, plan, reference);
      transaction.metadata.paystack = paystackRes;
      transaction.status = paystackRes?.status ? "success" : "failed";
    }

    // 🔹 Electricity
    if (type === "electricity") {
      const paystackRes = await payElectricity(meterNumber, provider, amount, reference);
      transaction.metadata.paystack = paystackRes;
      transaction.status = paystackRes?.status ? "success" : "failed";
    }

    await transaction.save();
    res.status(201).json({ message: "Transaction initiated", transaction });
  } catch (err) {
    console.error("❌ Transaction Error:", err.response?.data || err.message);
    res.status(500).json({ message: "Transaction failed", error: err.message });
  }
};

module.exports = { createTransaction };