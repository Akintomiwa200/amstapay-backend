const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema({
  claimDate: { type: Date, default: Date.now },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  documents: [String],
  resolution: String,
  resolvedAt: Date,
}, { _id: true });

const insuranceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  insuranceType: {
    type: String,
    enum: ["life", "health", "travel", "gadget"],
    required: true,
  },
  coverageAmount: {
    type: Number,
    required: true,
    min: 10000,
  },
  premium: {
    type: Number,
    required: true,
    min: 100,
  },
  premiumFrequency: {
    type: String,
    enum: ["monthly", "quarterly", "yearly"],
    default: "monthly",
  },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ["active", "expired", "cancelled", "claimed"],
    default: "active",
  },
  beneficiaries: [
    {
      fullName: { type: String, required: true },
      relationship: String,
      phoneNumber: String,
      email: String,
      percentage: { type: Number, min: 0, max: 100 },
    },
  ],
  claims: [claimSchema],
  metadata: {
    itemValue: Number,
    itemDescription: String,
    healthConditions: [String],
    travelDestination: String,
    travelDuration: Number,
  },
  policyNumber: { type: String, unique: true },
}, { timestamps: true });

insuranceSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model("Insurance", insuranceSchema);
