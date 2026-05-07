const mongoose = require("mongoose");

const roundupSavingsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  isActive: { type: Boolean, default: true },
  roundToNearest: { type: Number, default: 100 },
  totalSaved: { type: Number, default: 0 },
  totalRounds: { type: Number, default: 0 },
  multiplier: { type: Number, default: 1 },
  savingsGoal: { type: mongoose.Schema.Types.ObjectId, ref: "SavingsGoal" },
  lastRoundUpAt: Date,
}, { timestamps: true });

module.exports = mongoose.model("RoundupSavings", roundupSavingsSchema);
