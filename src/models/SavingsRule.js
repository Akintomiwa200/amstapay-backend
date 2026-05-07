const mongoose = require("mongoose");

const savingsRuleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ["percentage", "fixed", "roundup"], required: true },
  trigger: { type: String, enum: ["every_deposit", "every_transfer", "scheduled", "threshold"], required: true },
  value: { type: Number, required: true },
  maxAmount: Number,
  minAmount: Number,
  savingsGoal: { type: mongoose.Schema.Types.ObjectId, ref: "SavingsGoal" },
  schedule: {
    frequency: { type: String, enum: ["daily", "weekly", "monthly"] },
    day: Number,
    time: String,
  },
  isActive: { type: Boolean, default: true },
  totalSaved: { type: Number, default: 0 },
  executionCount: { type: Number, default: 0 },
  lastExecutedAt: Date,
}, { timestamps: true });

savingsRuleSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model("SavingsRule", savingsRuleSchema);
