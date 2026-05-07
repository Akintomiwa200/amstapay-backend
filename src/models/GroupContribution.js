const mongoose = require("mongoose");

const contributionSchema = new mongoose.Schema({
  member: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  paidAt: { type: Date, default: Date.now },
  cycle: { type: Number, required: true },
  transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
}, { _id: false });

const groupContributionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["admin", "member"], default: "member" },
    joinedAt: { type: Date, default: Date.now },
  }],
  contributionAmount: { type: Number, required: true },
  frequency: { type: String, enum: ["daily", "weekly", "monthly"], default: "monthly" },
  cycleDuration: { type: Number, required: true },
  currentCycle: { type: Number, default: 1 },
  totalCycles: { type: Number, required: true },
  payoutOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  currentPayoutIndex: { type: Number, default: 0 },
  totalSaved: { type: Number, default: 0 },
  status: { type: String, enum: ["active", "completed", "cancelled"], default: "active" },
  startDate: { type: Date, default: Date.now },
  endDate: Date,
  contributions: [contributionSchema],
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

groupContributionSchema.index({ creator: 1, status: 1 });
groupContributionSchema.index({ "members.user": 1 });

module.exports = mongoose.model("GroupContribution", groupContributionSchema);
