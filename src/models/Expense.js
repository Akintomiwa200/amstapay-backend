const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "NGN" },
  category: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ["expense", "income"], default: "expense" },
  paymentMethod: { type: String, enum: ["cash", "card", "bank", "wallet", "other"], default: "wallet" },
  receiptUrl: String,
  tags: [String],
  location: String,
  isRecurring: { type: Boolean, default: false },
  linkedTransaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model("Expense", expenseSchema);
