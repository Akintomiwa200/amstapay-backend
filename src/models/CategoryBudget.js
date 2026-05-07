const mongoose = require("mongoose");

const CATEGORIES = [
  "food", "transport", "utilities", "rent", "entertainment",
  "shopping", "health", "education", "bills", "savings",
  "transfer", "withdrawal", "airtime", "data", "other",
];

const budgetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: String, enum: CATEGORIES, required: true },
  monthlyLimit: { type: Number, required: true },
  spent: { type: Number, default: 0 },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  alertAtPercent: { type: Number, default: 80 },
  alertsEnabled: { type: Boolean, default: true },
}, { timestamps: true });

budgetSchema.index({ user: 1, category: 1, month: 1, year: 1 }, { unique: true });

const transactionCategorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", required: true },
  category: { type: String, enum: CATEGORIES, required: true },
  confidence: { type: Number, default: 1 },
  classifiedBy: { type: String, enum: ["auto", "user"], default: "auto" },
}, { timestamps: true });

transactionCategorySchema.index({ user: 1, category: 1, createdAt: -1 });

module.exports = {
  CategoryBudget: mongoose.model("CategoryBudget", budgetSchema),
  TransactionCategory: mongoose.model("TransactionCategory", transactionCategorySchema),
  CATEGORIES,
};
