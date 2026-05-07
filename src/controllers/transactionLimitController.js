const TransactionLimit = require("../models/TransactionLimit");

exports.getLimits = async (req, res) => {
  try {
    let limits = await TransactionLimit.findOne({ user: req.user._id });
    if (!limits) limits = await TransactionLimit.create({ user: req.user._id });
    res.json({ success: true, data: limits });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateLimits = async (req, res) => {
  try {
    const allowed = ["dailyTransfer", "weeklyTransfer", "monthlyTransfer", "dailyWithdrawal", "singleTransferMax"];
    const updates = {};
    for (const [key, val] of Object.entries(req.body)) {
      if (allowed.includes(key) && val > 0) updates[key] = val;
    }
    if (Object.keys(updates).length === 0) return res.status(400).json({ message: "No valid limits to update" });

    const limits = await TransactionLimit.findOneAndUpdate(
      { user: req.user._id },
      { $set: updates },
      { upsert: true, new: true },
    );
    res.json({ message: "Limits updated", data: limits });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
