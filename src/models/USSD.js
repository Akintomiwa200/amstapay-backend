const mongoose = require("mongoose");

const ussdSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  network: String,
  level: { type: Number, default: 0 },
  menu: { type: String, default: "main" },
  data: mongoose.Schema.Types.Mixed,
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

ussdSessionSchema.index({ sessionId: 1 });
ussdSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("USSD", ussdSessionSchema);
