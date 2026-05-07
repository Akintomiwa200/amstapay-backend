const mongoose = require("mongoose");

const notificationPrefSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  email: {
    enabled: { type: Boolean, default: true },
    login: { type: Boolean, default: true },
    transfer: { type: Boolean, default: true },
    billPayment: { type: Boolean, default: true },
    security: { type: Boolean, default: true },
    marketing: { type: Boolean, default: false },
  },
  sms: {
    enabled: { type: Boolean, default: true },
    login: { type: Boolean, default: false },
    transfer: { type: Boolean, default: true },
    billPayment: { type: Boolean, default: true },
    security: { type: Boolean, default: true },
    marketing: { type: Boolean, default: false },
  },
  whatsapp: {
    enabled: { type: Boolean, default: true },
    login: { type: Boolean, default: false },
    transfer: { type: Boolean, default: true },
    billPayment: { type: Boolean, default: false },
    security: { type: Boolean, default: true },
    marketing: { type: Boolean, default: false },
  },
  push: {
    enabled: { type: Boolean, default: true },
    login: { type: Boolean, default: true },
    transfer: { type: Boolean, default: true },
    billPayment: { type: Boolean, default: true },
    security: { type: Boolean, default: true },
    marketing: { type: Boolean, default: false },
  },
  quietHours: {
    enabled: { type: Boolean, default: false },
    start: String,
    end: String,
  },
}, { timestamps: true });

module.exports = mongoose.model("NotificationPreference", notificationPrefSchema);
