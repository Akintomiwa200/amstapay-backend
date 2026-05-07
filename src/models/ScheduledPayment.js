const mongoose = require("mongoose");

const scheduledPaymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["one_time", "standing_order"], required: true },
  recipientType: { type: String, enum: ["amstapay_user", "bank_account"], required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  recipientAccountNumber: String,
  recipientBank: String,
  recipientBankCode: String,
  recipientName: String,
  amount: { type: Number, required: true },
  currency: { type: String, default: "NGN" },
  description: String,
  status: { type: String, enum: ["active", "paused", "completed", "cancelled", "failed"], default: "active" },
  scheduledDate: { type: Date },
  frequency: { type: String, enum: ["daily", "weekly", "monthly", "quarterly", "yearly"] },
  executionDay: Number,
  executionTime: String,
  maxExecutions: Number,
  executionCount: { type: Number, default: 0 },
  lastExecutedAt: Date,
  nextExecutionDate: Date,
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

scheduledPaymentSchema.index({ user: 1, status: 1 });
scheduledPaymentSchema.index({ nextExecutionDate: 1, status: 1 });

module.exports = mongoose.model("ScheduledPayment", scheduledPaymentSchema);
