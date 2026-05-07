const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  provider: { type: String, required: true },
  plan: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "NGN" },
  billingCycle: { type: String, enum: ["weekly", "monthly", "quarterly", "yearly"], default: "monthly" },
  customerId: { type: String },
  status: { type: String, enum: ["active", "paused", "cancelled", "expired"], default: "active" },
  startDate: { type: Date, default: Date.now },
  nextBillingDate: Date,
  lastBilledAt: Date,
  autoRenew: { type: Boolean, default: true },
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ nextBillingDate: 1, status: 1 });

module.exports = mongoose.model("Subscription", subscriptionSchema);
