const mongoose = require("mongoose");

const recurringPaymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  description: String,
  amount: { type: Number, required: true, min: 1 },
  currency: { type: String, default: "NGN" },
  frequency: { type: String, enum: ["daily", "weekly", "monthly", "quarterly", "yearly"], required: true },
  startDate: { type: Date, required: true },
  endDate: Date,
  nextExecutionDate: { type: Date, required: true },
  lastExecutionDate: Date,
  status: { type: String, enum: ["active", "paused", "completed", "cancelled"], default: "active" },
  executionCount: { type: Number, default: 0 },
  maxExecutions: Number,
  recipientType: { type: String, enum: ["amstapay_user", "external_bank", "bill"], required: true },
  recipientAccountNumber: String,
  recipientBankCode: String,
  recipientName: String,
  billType: String,
  billProvider: String,
  billCustomerId: String,
  metadata: mongoose.Schema.Types.Mixed,
  failureCount: { type: Number, default: 0 },
  lastFailureReason: String,
}, { timestamps: true });

recurringPaymentSchema.index({ user: 1, status: 1 });
recurringPaymentSchema.index({ nextExecutionDate: 1, status: 1 });

module.exports = mongoose.model("RecurringPayment", recurringPaymentSchema);
