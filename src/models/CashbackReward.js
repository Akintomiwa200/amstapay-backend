const mongoose = require("mongoose");

const cashbackRewardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["cashback", "loyalty_points", "bonus", "referral"], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "NGN" },
  description: { type: String },
  source: { type: String },
  sourceTransaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
  status: { type: String, enum: ["pending", "credited", "expired"], default: "pending" },
  expiresAt: Date,
  creditedAt: Date,
}, { timestamps: true });

cashbackRewardSchema.index({ user: 1, status: 1 });
cashbackRewardSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model("CashbackReward", cashbackRewardSchema);
