const mongoose = require("mongoose");

const idempotencyKeySchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  response: { type: mongoose.Schema.Types.Mixed },
  statusCode: Number,
  expiresAt: { type: Date, index: { expireAfterSeconds: 0 } },
}, { timestamps: true });

module.exports = mongoose.model("IdempotencyKey", idempotencyKeySchema);
