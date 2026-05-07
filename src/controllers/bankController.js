// src/controllers/bankController.js
const Wallet = require('../models/Wallet');

// Get bank balance
const getBalance = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    res.json({ balance: wallet.balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Transfer money (internal)
const transfer = async (req, res) => {
  try {
    const { recipientId, amount } = req.body;

    const senderWallet = await Wallet.findOne({ user: req.user._id });
    const receiverWallet = await Wallet.findOne({ user: recipientId });

    if (!senderWallet || senderWallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    if (!receiverWallet) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    senderWallet.balance -= amount;
    receiverWallet.balance += amount;

    await senderWallet.save();
    await receiverWallet.save();

    res.json({ message: 'Transfer successful' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getBalance,
  transfer
};