const mongoose = require("mongoose");

const beneficiarySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["amstapay", "bank", "mobile_money"], required: true },
  name: { type: String, required: true },
  accountNumber: { type: String, required: true },
  bankName: String,
  bankCode: String,
  amstapayAccountNumber: String,
  phoneNumber: String,
  email: String,
  isFavorite: { type: Boolean, default: false },
  transferCount: { type: Number, default: 0 },
  lastTransferredAt: Date,
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

beneficiarySchema.index({ user: 1, isFavorite: -1 });
beneficiarySchema.index({ user: 1, transferCount: -1 });

module.exports = mongoose.model("Beneficiary", beneficiarySchema);
