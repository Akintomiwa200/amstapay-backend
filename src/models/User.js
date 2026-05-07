const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

function parseDate(dateString) {
  if (!dateString || typeof dateString !== 'string') return null;
  
  const formats = [
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
    /^(\d{2})-(\d{2})-(\d{4})$/,
    /^(\d{4})\/(\d{2})\/(\d{2})$/,
    /^(\d{4})-(\d{2})-(\d{2})$/,
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  ];
  
  for (const format of formats) {
    const match = dateString.match(format);
    if (match) {
      let day, month, year;
      
      if (format.source.startsWith('^(\\d{4}')) {
        year = parseInt(match[1]);
        month = parseInt(match[2]);
        day = parseInt(match[3]);
      } else {
        day = parseInt(match[1]);
        month = parseInt(match[2]);
        year = parseInt(match[3]);
      }
      
      const date = new Date(year, month - 1, day);
      if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
        return date;
      }
    }
  }
  
  return null;
}

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
    pin: { type: String, required: true },
    password: { type: String, required: true, minlength: 6 },

    accountType: {
      type: String,
      enum: ["personal", "business", "enterprise", "company", "agent"],
      required: true,
    },

    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    web3Wallet: {
      address: String,
      privateKey: String
    },
    web3Wallets: [{
      blockchain: { type: String, enum: ["ethereum", "bsc", "polygon", "solana", "bitcoin"] },
      address: String,
      privateKey: String,
      createdAt: { type: Date, default: Date.now }
    }],

    verificationCode: { type: String },
    codeExpires: { type: Date },
    isVerified: { type: Boolean, default: false },

    isOtpVerified: { type: Boolean, default: false },
    otpCode: { type: String },
    otpExpires: { type: Date },

    resetPasswordCode: { type: String },
    resetPasswordExpires: { type: Date },

    resetPinCode: { type: String },
    resetPinExpires: { type: Date },

    dateOfBirth: { 
      type: Date,
      set: function(v) {
        if (v instanceof Date) return v;
        if (typeof v === 'string') {
          const parsed = parseDate(v);
          return parsed || v;
        }
        return v;
      }
    },
    gender: { type: String },
    residentialAddress: { type: String },

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

    termsAgreed: { type: Boolean },
    infoAccurate: { type: Boolean },
    verificationConsent: { type: Boolean },

    loginAttempts: { type: Number, default: 0 },
    lockoutUntil: { type: Date },

    documents: {
      idDocument: String,
      utilityBill: String,
      passportPhoto: String,
      uploadedAt: Date,
    },

    deviceToken: { type: String },

    twoFactorSecret: { type: String },
    twoFactorEnabled: { type: Boolean, default: false },

    verifications: [verificationSchema],
    kycLevel: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (this.isNew) {
    if (!this.amstapayAccountNumber) {
      if (this.phoneNumber) {
        this.amstapayAccountNumber = this.phoneNumber.replace(/^0/, "");
      } else {
        this.amstapayAccountNumber = Math.floor(
          1000000000 + Math.random() * 9000000000
        ).toString();
      }
    }
  }

  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  if (this.isModified("pin")) {
    this.pin = await bcrypt.hash(this.pin, 10);
  }
});

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.comparePin = function (pin) {
  return bcrypt.compare(pin, this.pin);
};

module.exports = mongoose.model("User", userSchema);