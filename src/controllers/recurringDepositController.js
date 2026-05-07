const RecurringDeposit = require("../models/RecurringDeposit");
const Wallet = require("../models/Wallet");
const SavingsGoal = require("../models/SavingsGoal");
const Transaction = require("../models/Transaction");

exports.createSchedule = async (req, res) => {
  try {
    const { name, amount, frequency, executionDay, executionTime, savingsGoalId } = req.body;
    if (!name || !amount || !frequency) return res.status(400).json({ message: "name, amount, frequency required" });

    const nextDate = new Date();
    if (frequency === "monthly") { nextDate.setDate(executionDay || 1); if (nextDate < new Date()) nextDate.setMonth(nextDate.getMonth() + 1); }
    else if (frequency === "weekly") nextDate.setDate(nextDate.getDate() + 7);
    else if (frequency === "daily") nextDate.setDate(nextDate.getDate() + 1);

    const schedule = await RecurringDeposit.create({
      user: req.user._id, name, amount, frequency,
      executionDay: executionDay || 1, executionTime: executionTime || "09:00",
      savingsGoal: savingsGoalId, nextExecutionDate: nextDate,
    });

    res.status(201).json({ message: "Recurring deposit created", data: schedule });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listSchedules = async (req, res) => {
  try {
    const schedules = await RecurringDeposit.find({ user: req.user._id }).sort({ nextExecutionDate: 1 }).lean();
    res.json({ success: true, count: schedules.length, data: schedules });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleSchedule = async (req, res) => {
  try {
    const s = await RecurringDeposit.findOne({ _id: req.params.id, user: req.user._id });
    if (!s) return res.status(404).json({ message: "Schedule not found" });
    s.status = s.status === "active" ? "paused" : "active";
    await s.save();
    res.json({ message: `Schedule ${s.status === "active" ? "resumed" : "paused"}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.processSchedules = async () => {
  try {
    const due = await RecurringDeposit.find({
      status: "active", nextExecutionDate: { $lte: new Date() },
    });
    for (const s of due) {
      try {
        const wallet = await Wallet.findOne({ user: s.user });
        if (!wallet || wallet.balance < s.amount) {
          if (s.maxDeposits && s.totalDeposits >= s.maxDeposits) s.status = "completed";
          await s.save();
          continue;
        }
        wallet.balance -= s.amount;
        wallet.ledger.push({ type: "debit", amount: s.amount, description: `Recurring deposit: ${s.name}` });
        await wallet.save();

        if (s.savingsGoal) {
          const goal = await SavingsGoal.findById(s.savingsGoal);
          if (goal) { goal.currentAmount = (goal.currentAmount || 0) + s.amount; await goal.save(); }
        }

        s.totalDeposited += s.amount;
        s.totalDeposits += 1;
        s.lastExecutedAt = new Date();

        if (s.frequency === "daily") s.nextExecutionDate.setDate(s.nextExecutionDate.getDate() + 1);
        else if (s.frequency === "weekly") s.nextExecutionDate.setDate(s.nextExecutionDate.getDate() + 7);
        else if (s.frequency === "monthly") s.nextExecutionDate.setMonth(s.nextExecutionDate.getMonth() + 1);

        if (s.maxDeposits && s.totalDeposits >= s.maxDeposits) s.status = "completed";
        await s.save();
      } catch (err) {
        console.error(`Recurring deposit ${s._id} error:`, err.message);
      }
    }
  } catch (err) {
    console.error("Process deposits error:", err.message);
  }
};
