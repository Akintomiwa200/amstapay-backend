const RoundupSavings = require("../models/RoundupSavings");
const SavingsGoal = require("../models/SavingsGoal");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

exports.toggleRoundup = async (req, res) => {
  try {
    const { roundToNearest = 100, multiplier = 1, savingsGoalId } = req.body;

    let roundup = await RoundupSavings.findOne({ user: req.user._id });
    if (roundup) {
      roundup.isActive = !roundup.isActive;
      if (roundToNearest) roundup.roundToNearest = roundToNearest;
      if (multiplier) roundup.multiplier = multiplier;
      if (savingsGoalId) roundup.savingsGoal = savingsGoalId;
      await roundup.save();
    } else {
      roundup = await RoundupSavings.create({
        user: req.user._id, isActive: true,
        roundToNearest: roundToNearest || 100,
        multiplier: multiplier || 1, savingsGoal: savingsGoalId,
      });
    }

    res.json({ message: `Round-up savings ${roundup.isActive ? "enabled" : "disabled"}`, data: roundup });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRoundup = async (req, res) => {
  try {
    let roundup = await RoundupSavings.findOne({ user: req.user._id }).lean();
    if (!roundup) roundup = { isActive: false, totalSaved: 0, totalRounds: 0, roundToNearest: 100, multiplier: 1 };
    res.json({ success: true, data: roundup });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.processRoundup = async (amount, userId) => {
  try {
    const roundup = await RoundupSavings.findOne({ user: userId, isActive: true });
    if (!roundup) return 0;

    const remainder = amount % roundup.roundToNearest;
    if (remainder === 0) return 0;

    const roundupAmount = Math.round((roundup.roundToNearest - remainder) * roundup.multiplier * 100) / 100;
    if (roundupAmount <= 0) return 0;

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < roundupAmount) return 0;

    wallet.balance -= roundupAmount;
    wallet.ledger.push({ type: "debit", amount: roundupAmount, description: `Round-up savings: ₦${amount} → ₦${roundupAmount}` });
    await wallet.save();

    if (roundup.savingsGoal) {
      const goal = await SavingsGoal.findById(roundup.savingsGoal);
      if (goal) {
        goal.currentAmount = (goal.currentAmount || 0) + roundupAmount;
        if (goal.currentAmount >= goal.targetAmount) goal.status = "completed";
        await goal.save();
      }
    }

    roundup.totalSaved += roundupAmount;
    roundup.totalRounds += 1;
    roundup.lastRoundUpAt = new Date();
    await roundup.save();

    return roundupAmount;
  } catch (err) {
    console.error("Roundup error:", err.message);
    return 0;
  }
};
