const mongoose = require("mongoose");

const jointAccountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owners: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["admin", "member"], default: "member" },
    contribution: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now },
  }],
  balance: { type: Number, default: 0 },
  currency: { type: String, default: "NGN" },
  goalAmount: Number,
  goalDescription: String,
  status: { type: String, enum: ["active", "closed"], default: "active" },
  spendingLimit: { type: Number, default: 0 },
  requireBothApprovals: { type: Boolean, default: false },
  pendingApprovals: [{
    initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    amount: Number,
    description: String,
    approvedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: ["pending", "approved", "declined"], default: "pending" },
    createdAt: { type: Date, default: Date.now },
  }],
  transactionHistory: [{
    type: { type: String, enum: ["credit", "debit"] },
    amount: Number,
    description: String,
    byUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now },
  }],
  closedAt: Date,
}, { timestamps: true });

jointAccountSchema.index({ "owners.user": 1 });
jointAccountSchema.index({ status: 1 });

module.exports = mongoose.model("JointAccount", jointAccountSchema);
