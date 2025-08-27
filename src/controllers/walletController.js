const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

console.log("📁 Wallet controller loaded");

// ---------------------
// Get wallet balance
// ---------------------
exports.getBalance = async (req, res) => {
  try {
    const userId = req.user._id;

    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = await Wallet.create({ user: userId, balance: 0 });
    }

    res.json({ balance: wallet.balance });
  } catch (err) {
    console.error("❌ Error in getBalance:", err);
    res.status(500).json({ message: err.message });
  }
};

// ---------------------
// Fund wallet
// ---------------------
exports.fundWallet = async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }

    const userId = req.user._id;

    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) wallet = await Wallet.create({ user: userId, balance: 0 });

    wallet.balance += amount;
    await wallet.save();

    // Log transaction
    await Transaction.create({
      user: userId,
      type: "fund",
      amount,
      description: description || "Wallet funded",
    });

    res.json({ message: "Wallet funded successfully", balance: wallet.balance });
  } catch (err) {
    console.error("❌ Error in fundWallet:", err);
    res.status(500).json({ message: err.message });
  }
};

// ---------------------
// Withdraw wallet
// ---------------------
exports.withdrawWallet = async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }

    const userId = req.user._id;

    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

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
    console.error("❌ Error in withdrawWallet:", err);
    res.status(500).json({ message: err.message });
  }
};

// ---------------------
// Get wallet transaction history
// ---------------------
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user._id;

    const transactions = await Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("relatedUser", "fullName email");

    res.json(transactions);
  } catch (err) {
    console.error("❌ Error in getTransactions:", err);
    res.status(500).json({ message: err.message });
  }
};
