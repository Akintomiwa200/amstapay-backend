const mongoose = require("mongoose");

const paymentWebhookSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  url: { type: String, required: true },
  secret: { type: String },
  events: [{ type: String, enum: ["payment.success", "payment.failed", "transfer.success", "transfer.failed"] }],
  isActive: { type: Boolean, default: true },
  lastTriggeredAt: Date,
  lastResponseStatus: Number,
  failureCount: { type: Number, default: 0 },
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

paymentWebhookSchema.index({ user: 1 });

module.exports = mongoose.model("PaymentWebhook", paymentWebhookSchema);
