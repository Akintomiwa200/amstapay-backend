const mongoose = require("mongoose");

const microLoanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true, min: 1000, max: 50000 },
  currency: { type: String, default: "NGN" },
  fee: { type: Number, required: true },
  totalRepayable: { type: Number, required: true },
  tenureDays: { type: Number, required: true, enum: [7, 14, 30] },
  interestRate: { type: Number, required: true },
  status: { type: String, enum: ["active", "repaid", "overdue", "defaulted"], default: "active" },
  dueDate: { type: Date, required: true },
  repaidAt: Date,
  overdueDays: { type: Number, default: 0 },
  lateFee: { type: Number, default: 0 },
  transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
}, { timestamps: true });

microLoanSchema.index({ user: 1, status: 1 });
microLoanSchema.index({ dueDate: 1, status: 1 });

module.exports = mongoose.model("MicroLoan", microLoanSchema);
