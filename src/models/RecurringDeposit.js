const mongoose = require("mongoose");

const recurringDepositSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  frequency: { type: String, enum: ["daily", "weekly", "monthly"], required: true },
  executionDay: Number,
  executionTime: String,
  savingsGoal: { type: mongoose.Schema.Types.ObjectId, ref: "SavingsGoal" },
  source: { type: String, enum: ["wallet", "bank"], default: "wallet" },
  status: { type: String, enum: ["active", "paused", "cancelled", "completed"], default: "active" },
  totalDeposited: { type: Number, default: 0 },
  totalDeposits: { type: Number, default: 0 },
  nextExecutionDate: Date,
  lastExecutedAt: Date,
  maxDeposits: Number,
}, { timestamps: true });

recurringDepositSchema.index({ user: 1, status: 1 });
recurringDepositSchema.index({ nextExecutionDate: 1, status: 1 });

module.exports = mongoose.model("RecurringDeposit", recurringDepositSchema);
