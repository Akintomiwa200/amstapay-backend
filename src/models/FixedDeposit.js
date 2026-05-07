const mongoose = require("mongoose");

const fixedDepositSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true, min: 10000 },
  currency: { type: String, default: "NGN" },
  interestRate: { type: Number, required: true },
  tenureDays: { type: Number, required: true, enum: [30, 60, 90, 180, 365] },
  startDate: { type: Date, default: Date.now },
  maturityDate: { type: Date, required: true },
  interestEarned: { type: Number, default: 0 },
  totalPayout: { type: Number, default: 0 },
  status: { type: String, enum: ["active", "matured", "closed", "rolled_over"], default: "active" },
  autoRollover: { type: Boolean, default: false },
  rolledOverTo: { type: mongoose.Schema.Types.ObjectId, ref: "FixedDeposit" },
  closedAt: Date,
  receipt: { type: String },
}, { timestamps: true });

fixedDepositSchema.index({ user: 1, status: 1 });
fixedDepositSchema.index({ maturityDate: 1, status: 1 });

module.exports = mongoose.model("FixedDeposit", fixedDepositSchema);
