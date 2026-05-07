const mongoose = require("mongoose");

const currencyWalletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  currency: {
    type: String,
    enum: ["USD", "EUR", "GBP"],
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  ledger: [
    {
      type: { type: String, enum: ["credit", "debit"], required: true },
      amount: { type: Number, required: true },
      description: String,
      reference: String,
      transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
      createdAt: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });

currencyWalletSchema.index({ user: 1, currency: 1 }, { unique: true });

module.exports = mongoose.model("CurrencyWallet", currencyWalletSchema);
