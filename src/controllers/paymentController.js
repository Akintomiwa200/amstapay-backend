const Payment = require("../models/Payment");
const Wallet = require("../models/Wallet");

console.log("📁 Payment controller loaded");

// Send money via QR code
exports.sendPayment = async (req, res) => {
  try {
    const { receiverId, amount, description } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid receiver or amount" });
    }

    // Check sender wallet
    let senderWallet = await Wallet.findOne({ user: senderId });
    if (!senderWallet || senderWallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Deduct from sender
    senderWallet.balance -= amount;
    await senderWallet.save();

    // Credit receiver wallet
    let receiverWallet = await Wallet.findOne({ user: receiverId });
    if (!receiverWallet) {
      receiverWallet = await Wallet.create({ user: receiverId, balance: 0 });
    }
    receiverWallet.balance += amount;
    await receiverWallet.save();

    // Record payment
    const payment = await Payment.create({
      sender: senderId,
      receiver: receiverId,
      amount,
      type: "qr_payment",
      status: "completed",
      description,
    });

    res.json({ message: "Payment sent successfully", payment });
  } catch (err) {
    console.error("❌ Error in sendPayment:", err);
    res.status(500).json({ message: err.message });
  }
};

// Receive payment (can be same as send in this model)
exports.receivePayment = async (req, res) => {
  try {
    // In most systems, receiving is automatic via the sendPayment above
    res.json({ message: "Receive payment handled automatically via sendPayment" });
  } catch (err) {
    console.error("❌ Error in receivePayment:", err);
    res.status(500).json({ message: err.message });
  }
};
