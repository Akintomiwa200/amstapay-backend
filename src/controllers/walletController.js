const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

// ---------------------
// Get wallet balance
// ---------------------
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

// ---------------------
// Fund wallet
// ---------------------
exports.fundWallet = async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: "Valid amount required" });

    const userId = req.user._id;
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) wallet = await Wallet.create({ user: userId, balance: 0 });

    wallet.balance += amount;
    await wallet.save();

    await Transaction.create({
      user: userId,
      type: "fund",
      amount,
      description: description || "Wallet funded",
    });

    res.json({ message: "Wallet funded successfully", balance: wallet.balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------
// Withdraw from wallet
// ---------------------
exports.withdrawWallet = async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: "Valid amount required" });

    const userId = req.user._id;
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < amount) return res.status(400).json({ message: "Insufficient balance" });

    wallet.balance -= amount;
    await wallet.save();

    await Transaction.create({
      user: userId,
      type: "withdraw",
      amount,
      description: description || "Wallet withdrawal",
    });

    res.json({ message: "Withdrawal successful", balance: wallet.balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------
// Transfer between wallets
// ---------------------
exports.transferWallet = async (req, res) => {
  try {
    const { recipientAccountNumber, amount, description } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: "Valid amount required" });

    const senderId = req.user._id;
    const senderWallet = await Wallet.findOne({ user: senderId });
    if (!senderWallet || senderWallet.balance < amount) return res.status(400).json({ message: "Insufficient balance" });

    // find recipient
    const recipientUser = await User.findOne({ amstapayAccountNumber: recipientAccountNumber });
    if (!recipientUser) return res.status(404).json({ message: "Recipient not found" });

    let recipientWallet = await Wallet.findOne({ user: recipientUser._id });
    if (!recipientWallet) recipientWallet = await Wallet.create({ user: recipientUser._id, balance: 0 });

    // Deduct sender, add recipient
    senderWallet.balance -= amount;
    recipientWallet.balance += amount;
    await senderWallet.save();
    await recipientWallet.save();

    // Log transactions
    await Transaction.create({
      user: senderId,
      type: "transfer",
      amount,
      relatedUser: recipientUser._id,
      description: description || `Transfer to ${recipientUser.fullName}`,
    });

    await Transaction.create({
      user: recipientUser._id,
      type: "transfer",
      amount,
      relatedUser: senderId,
      description: description || `Received from ${req.user.fullName}`,
    });

    res.json({ message: "Transfer successful", balance: senderWallet.balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------
// Get wallet transactions
// ---------------------
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const transactions = await Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("relatedUser", "fullName email amstapayAccountNumber");

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
