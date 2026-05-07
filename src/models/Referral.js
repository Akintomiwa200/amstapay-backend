const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  referred: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  referralCode: {
    type: String,
    required: true,
    index: true,
  },
  reward: {
    type: Number,
    default: 0,
  },
  rewardCurrency: {
    type: String,
    default: "NGN",
  },
  status: {
    type: String,
    enum: ["pending", "paid", "cancelled"],
    default: "pending",
  },
  paidAt: Date,
  metadata: {
    referredName: String,
    referredEmail: String,
    referredPhone: String,
  },
}, { timestamps: true });

module.exports = mongoose.model("Referral", referralSchema);
