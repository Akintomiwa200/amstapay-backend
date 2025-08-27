// src/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phoneNumber: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  accountType: {
    type: String,
    enum: ["personal", "business", "enterprise", "company", "agent"],
    required: true,
  },
  isVerified: { type: Boolean, default: false },
  
  verificationCode: { type: String },
  codeExpires: { type: Date },

  // Agent-specific fields
  dateOfBirth: { type: String },
  gender: { type: String },
  residentialAddress: { type: String },
  bvnOrNin: { type: String },
  businessName: { type: String },
  businessAddress: { type: String },
  businessType: { type: String },
  bankName: { type: String },
  accountName: { type: String },
  accountNumber: { type: String },
  guarantorName: { type: String },
  guarantorRelationship: { type: String },
  guarantorPhone: { type: String },
  guarantorAddress: { type: String },
  termsAgreed: { type: Boolean },
  infoAccurate: { type: Boolean },
  verificationConsent: { type: Boolean },
  resetPasswordCode: { type: String },
resetPasswordExpires: { type: Date },

}, { timestamps: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
