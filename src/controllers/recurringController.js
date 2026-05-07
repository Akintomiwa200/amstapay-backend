const RecurringPayment = require("../models/RecurringPayment");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

exports.createRecurring = async (req, res) => {
  try {
    const { name, amount, frequency, startDate, recipientType, recipientAccountNumber, recipientBankCode, recipientName, description, maxExecutions, billType, billProvider, billCustomerId } = req.body;
    if (!name || !amount || !frequency || !recipientType) return res.status(400).json({ message: "Name, amount, frequency, and recipientType required" });

    const start = startDate ? new Date(startDate) : new Date();
    const nextDate = calculateNextDate(frequency, start);

    const payment = await RecurringPayment.create({
      user: req.user._id, name, amount, frequency, startDate: start, nextExecutionDate: nextDate, recipientType,
      recipientAccountNumber, recipientBankCode, recipientName, description, maxExecutions, billType, billProvider, billCustomerId,
    });
    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listRecurring = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;
    const payments = await RecurringPayment.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: payments.length, data: payments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRecurring = async (req, res) => {
  try {
    const payment = await RecurringPayment.findOne({ _id: req.params.id, user: req.user._id });
    if (!payment) return res.status(404).json({ message: "Recurring payment not found" });
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.pauseRecurring = async (req, res) => {
  try {
    const payment = await RecurringPayment.findOne({ _id: req.params.id, user: req.user._id });
    if (!payment) return res.status(404).json({ message: "Recurring payment not found" });
    payment.status = payment.status === "active" ? "paused" : "active";
    await payment.save();
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelRecurring = async (req, res) => {
  try {
    const payment = await RecurringPayment.findOne({ _id: req.params.id, user: req.user._id });
    if (!payment) return res.status(404).json({ message: "Recurring payment not found" });
    payment.status = "cancelled";
    await payment.save();
    res.json({ success: true, message: "Recurring payment cancelled" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.executeRecurringPayments = async () => {
  const now = new Date();
  now.setSeconds(0, 0);
  const due = await RecurringPayment.find({ status: "active", nextExecutionDate: { $lte: now } });
  for (const payment of due) {
    try {
      const wallet = await Wallet.findOne({ user: payment.user });
      if (!wallet || wallet.balance < payment.amount) {
        payment.failureCount += 1;
        payment.lastFailureReason = "Insufficient balance";
        if (payment.failureCount >= 3) payment.status = "paused";
        await payment.save();
        continue;
      }
      wallet.balance -= payment.amount;
      await wallet.save();
      await Transaction.create({
        sender: payment.user, type: "normal_transfer", amount: payment.amount,
        description: payment.description || `Recurring: ${payment.name}`,
        status: "success", reference: `REC-${Date.now()}`,
      });
      payment.executionCount += 1;
      payment.lastExecutionDate = now;
      payment.failureCount = 0;
      payment.lastFailureReason = null;
      if (payment.maxExecutions && payment.executionCount >= payment.maxExecutions) {
        payment.status = "completed";
      } else {
        payment.nextExecutionDate = calculateNextDate(payment.frequency, now);
      }
      await payment.save();
    } catch (err) {
      payment.failureCount += 1;
      payment.lastFailureReason = err.message;
      await payment.save();
    }
  }
};

function calculateNextDate(frequency, from) {
  const d = new Date(from);
  switch (frequency) {
    case "daily": d.setDate(d.getDate() + 1); break;
    case "weekly": d.setDate(d.getDate() + 7); break;
    case "monthly": d.setMonth(d.getMonth() + 1); break;
    case "quarterly": d.setMonth(d.getMonth() + 3); break;
    case "yearly": d.setFullYear(d.getFullYear() + 1); break;
  }
  return d;
}

setInterval(() => { exports.executeRecurringPayments().catch(() => {}); }, 60000);
