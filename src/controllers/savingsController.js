const SavingsGoal = require("../models/SavingsGoal");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

exports.createGoal = async (req, res) => {
  try {
    const { name, targetAmount, frequency, autoSaveAmount, lockUntil, category } = req.body;
    if (!name || !targetAmount) return res.status(400).json({ message: "Name and target amount required" });

    const goal = await SavingsGoal.create({
      user: req.user._id, name, targetAmount, frequency: frequency || "none",
      autoSaveAmount: autoSaveAmount || 0, lockUntil, category: category || "other",
    });
    res.status(201).json({ success: true, data: goal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listGoals = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;
    const goals = await SavingsGoal.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: goals.length, data: goals });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getGoal = async (req, res) => {
  try {
    const goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    res.json({ success: true, data: goal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.depositToGoal = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: "Valid amount required" });

    const goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    if (goal.status !== "active") return res.status(400).json({ message: "Goal is not active" });

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < amount) return res.status(400).json({ message: "Insufficient balance" });

    wallet.balance -= amount;
    await wallet.save();

    goal.savedAmount += amount;
    goal.transactions.push({ amount, type: "deposit", description: `Deposited ₦${amount} to ${goal.name}` });
    if (goal.savedAmount >= goal.targetAmount) {
      goal.status = "completed";
      goal.completedAt = new Date();
    }
    await goal.save();

    await Transaction.create({
      sender: req.user._id, type: "fund", amount,
      description: `Savings deposit: ${goal.name}`,
      status: "success", reference: `SAV-${Date.now()}`,
    });

    res.json({ success: true, data: goal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.withdrawFromGoal = async (req, res) => {
  try {
    const { amount } = req.body;
    const goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    if (goal.lockUntil && goal.lockUntil > new Date()) return res.status(400).json({ message: `Locked until ${goal.lockUntil.toDateString()}` });

    const withdrawAmount = amount || goal.savedAmount;
    if (withdrawAmount > goal.savedAmount) return res.status(400).json({ message: "Insufficient savings" });

    const wallet = await Wallet.findOne({ user: req.user._id });
    wallet.balance += withdrawAmount;
    await wallet.save();

    goal.savedAmount -= withdrawAmount;
    goal.transactions.push({ amount: withdrawAmount, type: "withdrawal", description: `Withdrew ₦${withdrawAmount} from ${goal.name}` });
    if (goal.savedAmount === 0 && withdrawAmount > 0) goal.status = "cancelled";
    await goal.save();

    res.json({ success: true, data: goal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelGoal = async (req, res) => {
  try {
    const goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    if (goal.savedAmount > 0) return res.status(400).json({ message: "Withdraw funds before cancelling" });
    goal.status = "cancelled";
    await goal.save();
    res.json({ success: true, message: "Goal cancelled" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
