const mongoose = require("mongoose");

const verificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  type: { type: String, enum: ["bvn", "nin", "bank"], required: true },
  dataProvided: { type: Object }, // e.g. { bvn: "...", dob: "..." }

  status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
  response: { type: Object }, // full API response for audit

}, { timestamps: true });

module.exports = mongoose.model("Verification", verificationSchema);
