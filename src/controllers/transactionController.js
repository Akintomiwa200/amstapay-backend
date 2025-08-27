// controllers/transactionController.js
const Transaction = require("../models/Transaction");
const User = require("../models/User");

console.log("📁 Transaction controller loaded");

// Create a new transaction
const createTransaction = async (req, res) => {
  try {
    console.log("🚀 createTransaction called");
    const { type, receiverAccountNumber, receiverName, receiverBank, amount, qrData, reference, merchantId, description } = req.body;
    
    if (!type || !amount) {
      return res.status(400).json({ message: "Transaction type and amount are required" });
    }

    const sender = req.user; // from auth middleware
    
    const transactionData = {
      sender: sender._id,
      type,
      amount,
      receiverAccountNumber: receiverAccountNumber || null,
      receiverName: receiverName || null,
      receiverBank: receiverBank || null,
      qrData: qrData || null,
      reference: reference || null,
      merchantId: merchantId || null,
      description: description || null,
      status: "pending",
    };

    const transaction = new Transaction(transactionData);
    await transaction.save();
    
    res.status(201).json({ message: "Transaction created", transaction });
  } catch (err) {
    console.error("❌ Error in createTransaction:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get all transactions for the logged-in user
const getTransactions = async (req, res) => {
  try {
    console.log("📋 getTransactions called");
    const transactions = await Transaction.find({ sender: req.user._id })
      .sort({ createdAt: -1 })
      .populate("sender", "fullName email phoneNumber");
      
    res.json(transactions);
  } catch (err) {
    console.error("❌ Error in getTransactions:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get single transaction by ID
const getTransactionById = async (req, res) => {
  try {
    console.log("🔍 getTransactionById called for ID:", req.params.id);
    const transaction = await Transaction.findById(req.params.id)
      .populate("sender", "fullName email phoneNumber");
    
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    if (transaction.sender._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json(transaction);
  } catch (err) {
    console.error("❌ Error in getTransactionById:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById
};