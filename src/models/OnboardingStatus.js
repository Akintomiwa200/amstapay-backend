const mongoose = require("mongoose");

const onboardingStatusSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  completedSteps: [{ type: String }],
  currentStep: { type: String, default: "welcome" },
  steps: {
    welcome: { type: Boolean, default: false },
    verifyEmail: { type: Boolean, default: false },
    createPin: { type: Boolean, default: false },
    addPhoneNumber: { type: Boolean, default: false },
    completeProfile: { type: Boolean, default: false },
    fundWallet: { type: Boolean, default: false },
    firstTransfer: { type: Boolean, default: false },
    kycVerification: { type: Boolean, default: false },
    setBiometric: { type: Boolean, default: false },
    referralCode: { type: Boolean, default: false },
  },
  completedAt: Date,
  skippedSteps: [String],
}, { timestamps: true });

module.exports = mongoose.model("OnboardingStatus", onboardingStatusSchema);
