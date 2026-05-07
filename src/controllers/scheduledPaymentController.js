const ScheduledPayment = require("../models/ScheduledPayment");
const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");
const User = require("../models/User");

exports.createScheduled = async (req, res) => {
  try {
    const { amount, scheduledDate, description } = req.body;
    if (!amount || !scheduledDate) return res.status(400).json({ message: "amount and scheduledDate required" });
    if (new Date(scheduledDate) <= new Date()) return res.status(400).json({ message: "Scheduled date must be in the future" });

    const payment = await ScheduledPayment.create({
      user: req.user._id, type: "one_time",
      recipientType: "amstapay_user",
      amount, scheduledDate: new Date(scheduledDate),
      description, nextExecutionDate: new Date(scheduledDate),
    });

    res.status(201).json({ message: "Scheduled payment created", data: payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createStandingOrder = async (req, res) => {
  try {
    const { amount, frequency, executionDay, recipientAccountNumber, description, maxExecutions } = req.body;
    if (!amount || !frequency || !recipientAccountNumber) {
      return res.status(400).json({ message: "amount, frequency, and recipientAccountNumber required" });
    }

    const recipient = await User.findOne({ amstapayAccountNumber: recipientAccountNumber });
    if (!recipient) return res.status(404).json({ message: "Recipient not found" });

    const nextDate = new Date();
    if (frequency === "monthly") nextDate.setDate(executionDay || 1);
    else if (frequency === "weekly") nextDate.setDate(nextDate.getDate() + 7);
    else if (frequency === "daily") nextDate.setDate(nextDate.getDate() + 1);
    else if (frequency === "quarterly") nextDate.setMonth(nextDate.getMonth() + 3);
    else if (frequency === "yearly") nextDate.setFullYear(nextDate.getFullYear() + 1);

    const standing = await ScheduledPayment.create({
      user: req.user._id, type: "standing_order",
      recipientType: "amstapay_user", recipientId: recipient._id,
      recipientAccountNumber, recipientName: recipient.fullName,
      amount, frequency, executionDay: executionDay || 1,
      description, maxExecutions: maxExecutions || 0,
      nextExecutionDate: nextDate,
    });

    res.status(201).json({ message: "Standing order created", data: standing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listPayments = async (req, res) => {
  try {
    const payments = await ScheduledPayment.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: payments.length, data: payments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelPayment = async (req, res) => {
  try {
    const payment = await ScheduledPayment.findOne({ _id: req.params.id, user: req.user._id });
    if (!payment) return res.status(404).json({ message: "Scheduled payment not found" });
    payment.status = "cancelled";
    await payment.save();
    res.json({ message: "Scheduled payment cancelled" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.pausePayment = async (req, res) => {
  try {
    const payment = await ScheduledPayment.findOne({ _id: req.params.id, user: req.user._id });
    if (!payment) return res.status(404).json({ message: "Scheduled payment not found" });
    payment.status = payment.status === "paused" ? "active" : "paused";
    await payment.save();
    res.json({ message: `Payment ${payment.status === "active" ? "resumed" : "paused"}`, status: payment.status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.processDuePayments = async () => {
  try {
    const due = await ScheduledPayment.find({
      status: "active", nextExecutionDate: { $lte: new Date() },
    }).populate("recipientId");
    for (const payment of due) {
      try {
        const wallet = await Wallet.findOne({ user: payment.user });
        if (!wallet || wallet.balance < payment.amount) {
          payment.status = "failed";
          await payment.save();
          continue;
        }
        wallet.balance -= payment.amount;
        wallet.ledger.push({ type: "debit", amount: payment.amount, description: payment.description || "Scheduled payment" });
        await wallet.save();

        if (payment.recipientId) {
          const rWallet = await Wallet.findOne({ user: payment.recipientId._id });
          if (rWallet) {
            rWallet.balance += payment.amount;
            rWallet.ledger.push({ type: "credit", amount: payment.amount, description: `Scheduled payment from ${payment.user}` });
            await rWallet.save();
          }
        }

        await Transaction.create({
          sender: payment.user, receiver: payment.recipientId?._id,
          amount: payment.amount, type: payment.type === "standing_order" ? "normal_transfer" : "normal_transfer",
          status: "success", reference: `SP-${Date.now()}`,
          description: payment.description || "Scheduled payment",
        });

        payment.executionCount += 1;
        payment.lastExecutedAt = new Date();

        if (payment.maxExecutions > 0 && payment.executionCount >= payment.maxExecutions) {
          payment.status = "completed";
        } else {
          if (payment.frequency === "daily") payment.nextExecutionDate.setDate(payment.nextExecutionDate.getDate() + 1);
          else if (payment.frequency === "weekly") payment.nextExecutionDate.setDate(payment.nextExecutionDate.getDate() + 7);
          else if (payment.frequency === "monthly") payment.nextExecutionDate.setMonth(payment.nextExecutionDate.getMonth() + 1);
          else if (payment.frequency === "quarterly") payment.nextExecutionDate.setMonth(payment.nextExecutionDate.getMonth() + 3);
          else if (payment.frequency === "yearly") payment.nextExecutionDate.setFullYear(payment.nextExecutionDate.getFullYear() + 1);
        }
        await payment.save();
      } catch (err) {
        console.error(`Scheduled payment ${payment._id} failed:`, err.message);
      }
    }
  } catch (err) {
    console.error("Process due payments error:", err.message);
  }
};
