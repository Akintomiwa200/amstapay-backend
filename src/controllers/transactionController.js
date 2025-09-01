const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { sendEmail } = require("../services/emailService");
const axios = require("axios");
const crypto = require("crypto");

/**
 * Create a new transaction
 */
const createTransaction = async (req, res) => {
  try {
    const { receiverId, amount, description } = req.body;

    const sender = await User.findById(req.user._id);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({ message: "Sender or receiver not found" });
    }

    if (sender.balance < amount) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    const transaction = new Transaction({
      sender: sender._id,
      receiver: receiver._id,
      amount,
      description,
      status: "pending",
    });

    await transaction.save();

    // Send email notifications
    await sendEmail(
      sender.email,
      "Transaction Initiated",
      `You have initiated a payment of ₦${amount} to ${receiver.name}`
    );

    await sendEmail(
      receiver.email,
      "Incoming Payment",
      `You have a new incoming payment of ₦${amount} from ${sender.name}`
    );

    res.status(201).json({ message: "Transaction created successfully", transaction });
  } catch (err) {
    res.status(500).json({ message: "Failed to create transaction", error: err.message });
  }
};

/**
 * Fetch all transactions of the authenticated user
 */
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    })
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch transactions", error: err.message });
  }
};

/**
 * Fetch a single transaction by ID
 */
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("sender", "name email")
      .populate("receiver", "name email");

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Ensure user is involved in the transaction
    if (
      transaction.sender._id.toString() !== req.user._id.toString() &&
      transaction.receiver._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized to view this transaction" });
    }

    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch transaction", error: err.message });
  }
};

/**
 * Update transaction status (admin or Paystack verification)
 */
const updateTransactionStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const transaction = await Transaction.findById(req.params.id)
      .populate("sender")
      .populate("receiver");

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    transaction.status = status;
    await transaction.save();

    // If completed, adjust balances
    if (status === "completed") {
      transaction.sender.balance -= transaction.amount;
      transaction.receiver.balance += transaction.amount;
      await transaction.sender.save();
      await transaction.receiver.save();
    }

    // Notify both parties
    await sendEmail(
      transaction.sender.email,
      "Transaction Update",
      `Your transaction of ₦${transaction.amount} is now ${status}.`
    );

    await sendEmail(
      transaction.receiver.email,
      "Transaction Update",
      `You have received ₦${transaction.amount}. Status: ${status}`
    );

    res.json({ message: "Transaction status updated", transaction });
  } catch (err) {
    res.status(500).json({ message: "Failed to update transaction", error: err.message });
  }
};

/**
 * Handle Paystack webhook
 */
const handlePaystackWebhook = async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;

    // Verify signature
    const hash = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    const event = req.body;
    console.log("🔔 Paystack Event:", event.event);

    if (event.event === "charge.success") {
      const { reference, amount } = event.data;

      // Find transaction by reference
      const transaction = await Transaction.findOne({ reference })
        .populate("sender")
        .populate("receiver");

      if (transaction) {
        transaction.status = "completed";
        await transaction.save();

        // Adjust balances
        transaction.sender.balance -= transaction.amount;
        transaction.receiver.balance += transaction.amount;
        await transaction.sender.save();
        await transaction.receiver.save();

        // Notify users
        await sendEmail(
          transaction.sender.email,
          "Payment Successful",
          `Your payment of ₦${amount / 100} was successful.`
        );

        await sendEmail(
          transaction.receiver.email,
          "Payment Received",
          `You received ₦${amount / 100} from ${transaction.sender.name}.`
        );
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    res.status(500).json({ message: "Webhook error", error: err.message });
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransactionStatus,
  handlePaystackWebhook,
};
