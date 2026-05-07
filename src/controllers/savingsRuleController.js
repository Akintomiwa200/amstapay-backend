const SavingsRule = require("../models/SavingsRule");
const Wallet = require("../models/Wallet");
const SavingsGoal = require("../models/SavingsGoal");

exports.createRule = async (req, res) => {
  try {
    const { name, type, trigger, value, savingsGoalId, schedule, maxAmount } = req.body;
    if (!name || !type || !trigger || !value) return res.status(400).json({ message: "name, type, trigger, value required" });

    const rule = await SavingsRule.create({
      user: req.user._id, name, type, trigger, value,
      savingsGoal: savingsGoalId, schedule, maxAmount,
    });

    res.status(201).json({ message: "Savings rule created", data: rule });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listRules = async (req, res) => {
  try {
    const rules = await SavingsRule.find({ user: req.user._id }).lean();
    res.json({ success: true, count: rules.length, data: rules });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleRule = async (req, res) => {
  try {
    const rule = await SavingsRule.findOne({ _id: req.params.id, user: req.user._id });
    if (!rule) return res.status(404).json({ message: "Rule not found" });
    rule.isActive = !rule.isActive;
    await rule.save();
    res.json({ message: `Rule ${rule.isActive ? "activated" : "deactivated"}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.applyAutoSave = async (userId, amount, type) => {
  try {
    const rules = await SavingsRule.find({ user: userId, isActive: true });
    for (const rule of rules) {
      if (rule.trigger === "every_deposit" && type !== "fund") continue;
      if (rule.trigger === "every_transfer" && type === "fund") continue;

      let saveAmount = rule.type === "percentage" ? Math.round(amount * (rule.value / 100) * 100) / 100 : rule.value;
      if (rule.maxAmount && saveAmount > rule.maxAmount) saveAmount = rule.maxAmount;
      if (rule.minAmount && saveAmount < rule.minAmount) saveAmount = rule.minAmount;
      if (saveAmount <= 0) continue;

      const wallet = await Wallet.findOne({ user: userId });
      if (!wallet || wallet.balance < saveAmount) continue;

      wallet.balance -= saveAmount;
      wallet.ledger.push({ type: "debit", amount: saveAmount, description: `Auto-save: ${rule.name}` });
      await wallet.save();

      if (rule.savingsGoal) {
        const goal = await SavingsGoal.findById(rule.savingsGoal);
        if (goal) { goal.currentAmount = (goal.currentAmount || 0) + saveAmount; await goal.save(); }
      }

      rule.totalSaved += saveAmount;
      rule.executionCount += 1;
      rule.lastExecutedAt = new Date();
      await rule.save();
    }
  } catch (err) {
    console.error("Auto-save error:", err.message);
  }
};
