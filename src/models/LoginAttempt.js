const mongoose = require("mongoose");

const loginAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  identifier: { type: String, index: true },
  ip: { type: String, index: true },
  userAgent: String,
  attemptType: { type: String, enum: ["password", "pin", "otp", "2fa"], default: "password" },
  success: { type: Boolean, default: false },
  failureReason: String,
}, { timestamps: true });

loginAttemptSchema.index({ identifier: 1, createdAt: -1 });
loginAttemptSchema.index({ user: 1, attemptType: 1, createdAt: -1 });

module.exports = mongoose.model("LoginAttempt", loginAttemptSchema);
