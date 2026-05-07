const mongoose = require("mongoose");

const moneyRequestSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "NGN" },
  description: String,
  status: { type: String, enum: ["pending", "paid", "declined", "cancelled"], default: "pending" },
  transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
  expiresAt: Date,
  respondedAt: Date,
}, { timestamps: true });

moneyRequestSchema.index({ requester: 1, status: 1 });
moneyRequestSchema.index({ recipient: 1, status: 1 });

module.exports = mongoose.model("MoneyRequest", moneyRequestSchema);
