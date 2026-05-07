const mongoose = require("mongoose");

const deviceSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  deviceId: { type: String, required: true },
  deviceName: String,
  deviceType: { type: String, enum: ["mobile", "tablet", "desktop", "unknown"], default: "unknown" },
  os: String,
  browser: String,
  ip: String,
  userAgent: String,
  refreshToken: { type: String },
  refreshTokenHash: { type: String, index: true },
  isActive: { type: Boolean, default: true },
  lastActiveAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  loggedOutAt: Date,
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

deviceSessionSchema.index({ user: 1, isActive: 1 });
deviceSessionSchema.index({ refreshTokenHash: 1 });

module.exports = mongoose.model("DeviceSession", deviceSessionSchema);
