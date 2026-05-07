const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: { type: String, required: true, index: true },
  resource: { type: String },
  resourceId: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String },
  userAgent: { type: String },
  deviceId: { type: String },
  geo: {
    country: String,
    city: String,
    lat: Number,
    lon: Number,
  },
  success: { type: Boolean, default: true },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ ip: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
