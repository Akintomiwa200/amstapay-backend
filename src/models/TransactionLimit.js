const mongoose = require("mongoose");

const transactionLimitSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  dailyTransfer: { type: Number, default: 1000000 },
  dailyTransferUsed: { type: Number, default: 0 },
  dailyTransferReset: { type: Date },
  weeklyTransfer: { type: Number, default: 5000000 },
  weeklyTransferUsed: { type: Number, default: 0 },
  weeklyTransferReset: { type: Date },
  monthlyTransfer: { type: Number, default: 10000000 },
  monthlyTransferUsed: { type: Number, default: 0 },
  monthlyTransferReset: { type: Date },
  dailyWithdrawal: { type: Number, default: 500000 },
  dailyWithdrawalUsed: { type: Number, default: 0 },
  dailyWithdrawalReset: { type: Date },
  singleTransferMax: { type: Number, default: 500000 },
  kycLevelOverrides: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model("TransactionLimit", transactionLimitSchema);
