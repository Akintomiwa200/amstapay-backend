const mongoose = require("mongoose");

const paymentLinkSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: String,
  amount: { type: Number, required: true },
  currency: { type: String, default: "NGN" },
  slug: { type: String, unique: true, required: true },
  isActive: { type: Boolean, default: true },
  maxPaymentCount: { type: Number, default: 1 },
  paymentCount: { type: Number, default: 0 },
  totalCollected: { type: Number, default: 0 },
  expiresAt: Date,
  redirectUrl: String,
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

paymentLinkSchema.index({ user: 1, createdAt: -1 });
paymentLinkSchema.index({ slug: 1 });

module.exports = mongoose.model("PaymentLink", paymentLinkSchema);
