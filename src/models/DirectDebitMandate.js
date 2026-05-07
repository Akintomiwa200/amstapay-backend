const mongoose = require("mongoose");

const directDebitMandateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  mandateCode: { type: String, unique: true, required: true },
  merchantName: { type: String, required: true },
  merchantId: String,
  maxAmount: { type: Number, required: true },
  frequency: { type: String, enum: ["one_time", "daily", "weekly", "monthly", "quarterly", "yearly"], required: true },
  startDate: { type: Date, required: true },
  endDate: Date,
  status: { type: String, enum: ["active", "paused", "completed", "cancelled", "failed"], default: "active" },
  paymentHistory: [{
    amount: Number, date: { type: Date, default: Date.now },
    status: String, reference: String,
  }],
  nextPaymentDate: Date,
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

directDebitMandateSchema.index({ user: 1, status: 1 });
directDebitMandateSchema.index({ mandateCode: 1 });

module.exports = mongoose.model("DirectDebitMandate", directDebitMandateSchema);
