const mongoose = require("mongoose");

const escrowSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true, min: 1 },
  currency: { type: String, default: "NGN" },
  fee: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  title: { type: String, required: true },
  description: String,
  reference: { type: String, unique: true },
  status: {
    type: String,
    enum: ["pending", "funded", "in_progress", "completed", "disputed", "released", "refunded", "cancelled"],
    default: "pending",
  },
  terms: String,
  attachments: [String],
  buyerNotes: String,
  sellerNotes: String,
  disputeReason: String,
  disputeOpenedAt: Date,
  disputeResolvedAt: Date,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  fundedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  daysToComplete: { type: Number, default: 7 },
  deadline: Date,
  timeline: [{
    status: String,
    date: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    note: String,
  }],
  transactions: [{
    type: { type: String, enum: ["fund", "release", "refund", "fee"] },
    amount: Number,
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
    date: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

escrowSchema.index({ buyer: 1, status: 1 });
escrowSchema.index({ seller: 1, status: 1 });
escrowSchema.index({ reference: 1 }, { unique: true });

module.exports = mongoose.model("Escrow", escrowSchema);
