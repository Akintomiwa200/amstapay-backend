const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  type: { type: String, enum: ["gift", "promo", "cashback"], default: "gift" },
  amount: { type: Number, required: true },
  currency: { type: String, default: "NGN" },
  issuer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  recipientEmail: String,
  recipientPhone: String,
  message: String,
  status: { type: String, enum: ["active", "redeemed", "expired", "cancelled"], default: "active" },
  redeemedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  redeemedAt: Date,
  expiresAt: Date,
  transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

voucherSchema.index({ code: 1 });
voucherSchema.index({ issuer: 1, status: 1 });
voucherSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model("Voucher", voucherSchema);
