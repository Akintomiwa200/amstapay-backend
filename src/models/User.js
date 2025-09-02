const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const verificationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["BVN", "NIN", "Bank", "Document"], required: true },
    value: { type: String },
    status: { type: String, enum: ["pending", "verified", "failed"], default: "pending" },
    provider: { type: String },
    verifiedAt: { type: Date },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },

    email: { type: String, unique: true, sparse: true },
    phoneNumber: { type: String, unique: true, sparse: true },

    amstapayAccountNumber: { type: String, unique: true },

    // Remove minlength/maxlength; we hash PIN
    pin: { type: String, required: true },
    password: { type: String, required: true },

    accountType: {
      type: String,
      enum: ["personal", "business", "enterprise", "company", "agent"],
      required: true,
    },

    verificationCode: { type: String },
    codeExpires: { type: Date },
    isVerified: { type: Boolean, default: false },

    // OTP verification
    isOtpVerified: { type: Boolean, default: false },
    otpCode: { type: String },
    otpExpires: { type: Date },

    resetPasswordCode: { type: String },
    resetPasswordExpires: { type: Date },

    // Agent-specific
    dateOfBirth: { type: Date },
    gender: { type: String },
    residentialAddress: { type: String },

    // Personal / Business Bank Info
    bankName: {
      type: String,
      required: function () {
        return ["business", "enterprise", "company"].includes(this.accountType);
      },
    },
    accountName: {
      type: String,
      required: function () {
        return ["business", "enterprise", "company"].includes(this.accountType);
      },
    },
    accountNumber: {
      type: String,
      required: function () {
        return ["business", "enterprise", "company"].includes(this.accountType);
      },
    },

    // Business
    businessName: {
      type: String,
      required: function () {
        return ["business", "enterprise", "company"].includes(this.accountType);
      },
    },
    businessAddress: {
      type: String,
      required: function () {
        return ["business", "enterprise", "company"].includes(this.accountType);
      },
    },
    businessType: {
      type: String,
      required: function () {
        return ["business", "enterprise", "company"].includes(this.accountType);
      },
    },

    // Agent
    guarantorName: {
      type: String,
      required: function () {
        return this.accountType === "agent";
      },
    },
    guarantorRelationship: {
      type: String,
      required: function () {
        return this.accountType === "agent";
      },
    },
    guarantorPhone: {
      type: String,
      required: function () {
        return this.accountType === "agent";
      },
    },
    guarantorAddress: {
      type: String,
      required: function () {
        return this.accountType === "agent";
      },
    },

    // Documents (base64 or file path)
    idDocument: { type: String },
    utilityBill: { type: String },
    passportPhoto: { type: String },

    // Consent
    termsAgreed: { type: Boolean },
    infoAccurate: { type: Boolean },
    verificationConsent: { type: Boolean },

    // KYC
    verifications: [verificationSchema],
    kycLevel: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// --------------------
// Pre-save: generate account number + hash password & pin
// --------------------
userSchema.pre("save", async function (next) {
  if (this.isNew) {
    if (!this.amstapayAccountNumber) {
      this.amstapayAccountNumber = this.phoneNumber
        ? this.phoneNumber.replace(/^0/, "")
        : Math.floor(1000000000 + Math.random() * 9000000000).toString();
    }
  }

  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  if (this.isModified("pin")) {
    this.pin = await bcrypt.hash(this.pin, 10);
  }

  next();
});

// --------------------
// Compare password
// --------------------
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

// --------------------
// Compare PIN
// --------------------
userSchema.methods.comparePin = function (pin) {
  return bcrypt.compare(pin, this.pin);
};

module.exports = mongoose.model("User", userSchema);
