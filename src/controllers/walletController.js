const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const axios = require("axios");

const paystack = axios.create({
  baseURL: "https://api.paystack.co",
  headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
});

exports.getBalance = async (req, res) => {
  try {
    const userId = req.user._id;
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) wallet = await Wallet.create({ user: userId, balance: 0 });
    res.json({ balance: wallet.balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.fundWallet = async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: "Valid amount required" });

    const userId = req.user._id;
    const email = req.user.email;
    const reference = `FUND-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    let paystackResponse = null;
    try {
      const resp = await paystack.post("/transaction/initialize", {
        email, amount: amount * 100, reference,
        callback_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/wallet/fund/callback`,
      });
      paystackResponse = resp.data;
    } catch (psErr) {
      console.error("Paystack init error:", psErr.response?.data || psErr.message);
    }

    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) wallet = await Wallet.create({ user: userId, balance: 0 });

    if (paystackResponse?.status) {
      wallet.balance += amount;
      await wallet.save();
    }

    const txn = await Transaction.create({
      sender: userId, type: "fund", amount,
      description: description || "Wallet funded",
      status: paystackResponse?.status ? "success" : "pending",
      reference, paystackResponse,
    });

    res.json({
      message: paystackResponse?.status ? "Wallet funded successfully" : "Funding initiated",
      balance: wallet.balance,
      authorization_url: paystackResponse?.data?.authorization_url,
      reference, transaction: txn,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.withdrawWallet = async (req, res) => {
  try {
    const { amount, bankCode, accountNumber, accountName, description } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: "Valid amount required" });
    if (!bankCode || !accountNumber) return res.status(400).json({ message: "Bank code and account number required" });

    const userId = req.user._id;
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < amount) return res.status(400).json({ message: "Insufficient balance" });

    const reference = `WDR-${Date.now()}`;

    try {
      const recipientResp = await paystack.post("/transferrecipient", {
        type: "nuban", name: accountName || req.user.fullName,
        account_number: accountNumber, bank_code: bankCode, currency: "NGN",
      });

      if (recipientResp.data?.status) {
        const recipientCode = recipientResp.data.data.recipient_code;
        const transferResp = await paystack.post("/transfer", {
          source: "balance", amount: amount * 100,
          recipient: recipientCode, reason: description || "Wallet withdrawal", reference,
        });

        if (transferResp.data?.status) {
          wallet.balance -= amount;
          await wallet.save();
        }
      }
    } catch (psErr) {
      console.error("Paystack withdrawal error:", psErr.response?.data || psErr.message);
    }

    wallet.balance -= amount;
    await wallet.save();

    await Transaction.create({
      sender: userId, type: "withdraw", amount,
      description: description || `Withdrawal to ${accountName || accountNumber}`,
      status: "success", reference, receiverAccountNumber: accountNumber, receiverBank: bankCode,
    });

    res.json({ message: "Withdrawal successful", balance: wallet.balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.transferWallet = async (req, res) => {
  try {
    const { recipientAccountNumber, amount, description } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: "Valid amount required" });

    const senderId = req.user._id;
    const senderWallet = await Wallet.findOne({ user: senderId });
    if (!senderWallet || senderWallet.balance < amount) return res.status(400).json({ message: "Insufficient balance" });

    const recipientUser = await User.findOne({ amstapayAccountNumber: recipientAccountNumber });
    if (!recipientUser) return res.status(404).json({ message: "Recipient not found" });

    let recipientWallet = await Wallet.findOne({ user: recipientUser._id });
    if (!recipientWallet) recipientWallet = await Wallet.create({ user: recipientUser._id, balance: 0 });

    senderWallet.balance -= amount;
    recipientWallet.balance += amount;
    await senderWallet.save();
    await recipientWallet.save();

    await Transaction.create({
      sender: senderId, type: "normal_transfer", amount,
      receiver: recipientUser._id,
      description: description || `Transfer to ${recipientUser.fullName}`,
      status: "success",
    });

    res.json({ message: "Transfer successful", balance: senderWallet.balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ sender: req.user._id })
      .sort({ createdAt: -1 }).populate("receiver", "fullName email amstapayAccountNumber");
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
