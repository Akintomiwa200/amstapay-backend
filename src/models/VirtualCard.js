const mongoose = require("mongoose");

const virtualCardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cardName: { type: String, required: true },
  cardType: { type: String, enum: ["naira", "dollar"], required: true },
  currency: { type: String, enum: ["NGN", "USD"], required: true },
  cardNumber: { type: String, unique: true },
  expMonth: String,
  expYear: String,
  cvv: String,
  balance: { type: Number, default: 0 },
  fundingSource: { type: String, enum: ["wallet"], default: "wallet" },
  status: { type: String, enum: ["active", "frozen", "cancelled", "expired"], default: "active" },
  dailyLimit: { type: Number, default: 100000 },
  monthlyLimit: { type: Number, default: 1000000 },
  spentToday: { type: Number, default: 0 },
  spentThisMonth: { type: Number, default: 0 },
  lastUsedAt: Date,
  frozenAt: Date,
  cancelledAt: Date,
  expiresAt: { type: Date },
  transactions: [{
    amount: Number,
    merchant: String,
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ["pending", "completed", "failed", "reversed"] },
    reference: String,
  }],
}, { timestamps: true });

virtualCardSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model("VirtualCard", virtualCardSchema);
