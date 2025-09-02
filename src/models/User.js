const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const verificationSchema = new mongoose.Schema(
  {
    type: { 
      type: String, 
      enum: ["BVN", "NIN", "Bank", "Document", "Phone", "Email"], 
      required: true 
    },
    value: { type: String },
    status: { 
      type: String, 
      enum: ["pending", "verified", "failed"], 
      default: "pending" 
    },
    provider: { type: String },
    verifiedAt: { type: Date },
    metadata: { type: mongoose.Schema.Types.Mixed }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: { 
      type: String, 
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [100, "Full name cannot exceed 100 characters"]
    },

    email: { 
      type: String, 
      unique: true, 
      sparse: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Please enter a valid email address"
      }
    },

    phoneNumber: { 
      type: String, 
      unique: true, 
      sparse: true,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^(\+234|0)[789][01]\d{8}$/.test(v);
        },
        message: "Please enter a valid Nigerian phone number"
      }
    },

    amstapayAccountNumber: { 
      type: String, 
      unique: true,
      index: true
    },

    // PIN - Allow null initially, validate only when setting
    pin: { 
      type: String,
      default: null,
      validate: {
        validator: function(v) {
          // Skip validation if PIN is null/undefined or already hashed
          if (!v || v.startsWith('$2b$')) return true;
          return /^\d{4,6}$/.test(v);
        },
        message: "PIN must be 4-6 digits"
      }
    },

    password: { 
      type: String, 
      required: [true, "Password is required"],
      validate: {
        validator: function(v) {
          // Skip validation if already hashed
          if (v && v.startsWith('$2b$')) return true;
          return v && v.length >= 6;
        },
        message: "Password must be at least 6 characters"
      }
    },

    accountType: {
      type: String,
      enum: {
        values: ["personal", "business", "enterprise", "company", "agent"],
        message: "Invalid account type"
      },
      required: [true, "Account type is required"]
    },

    // Add role field for admin functionality
    role: {
      type: String,
      enum: ["user", "admin", "super_admin"],
      default: "user"
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

    // Personal information
    dateOfBirth: { 
      type: Date,
      validate: {
        validator: function(v) {
          if (!v) return true;
          const age = (new Date() - v) / (365.25 * 24 * 60 * 60 * 1000);
          return age >= 13 && age <= 120;
        },
        message: "Please enter a valid date of birth"
      }
    },
    
    gender: { 
      type: String,
      enum: {
        values: ["Male", "Female", "Other"],
        message: "Gender must be Male, Female, or Other"
      }
    },
    
    residentialAddress: { 
      type: String,
      trim: true,
      maxlength: [500, "Address cannot exceed 500 characters"]
    },

    // Bank Information
    bankName: {
      type: String,
      trim: true,
      required: function () {
        return ["business", "enterprise", "company", "agent"].includes(this.accountType);
      }
    },
    
    accountName: {
      type: String,
      trim: true,
      required: function () {
        return ["business", "enterprise", "company", "agent"].includes(this.accountType);
      }
    },
    
    accountNumber: {
      type: String,
      trim: true,
      required: function () {
        return ["business", "enterprise", "company", "agent"].includes(this.accountType);
      },
      validate: {
        validator: function(v) {
          if (!["business", "enterprise", "company", "agent"].includes(this.accountType)) return true;
          return !v || /^\d{10}$/.test(v);
        },
        message: "Account number must be 10 digits"
      }
    },

    // Business Information
    businessName: {
      type: String,
      trim: true,
      required: function () {
        return ["business", "enterprise", "company"].includes(this.accountType);
      }
    },
    
    businessAddress: {
      type: String,
      trim: true,
      required: function () {
        return ["business", "enterprise", "company"].includes(this.accountType);
      }
    },
    
    businessType: {
      type: String,
      trim: true,
      required: function () {
        return ["business", "enterprise", "company"].includes(this.accountType);
      }
    },

    // Agent/Guarantor Information
    guarantorName: {
      type: String,
      trim: true,
      required: function () {
        return this.accountType === "agent";
      }
    },
    
    guarantorRelationship: {
      type: String,
      trim: true,
      required: function () {
        return this.accountType === "agent";
      }
    },
    
    guarantorPhone: {
      type: String,
      trim: true,
      required: function () {
        return this.accountType === "agent";
      },
      validate: {
        validator: function(v) {
          if (this.accountType !== "agent") return true;
          return !v || /^(\+234|0)[789][01]\d{8}$/.test(v);
        },
        message: "Please enter a valid Nigerian phone number for guarantor"
      }
    },
    
    guarantorAddress: {
      type: String,
      trim: true,
      required: function () {
        return this.accountType === "agent";
      }
    },

    // Documents (file paths)
    idDocument: { type: String },
    utilityBill: { type: String },
    passportPhoto: { type: String },

    // Consent flags
    termsAgreed: { type: Boolean, default: false },
    infoAccurate: { type: Boolean, default: false },
    verificationConsent: { type: Boolean, default: false },

    // KYC
    verifications: [verificationSchema],
    kycLevel: { type: Number, default: 0, min: 0, max: 3 },
  },
  { 
    timestamps: true,
    // Add indexes for better performance
    indexes: [
      { email: 1 },
      { phoneNumber: 1 },
      { amstapayAccountNumber: 1 },
      { accountType: 1 },
      { kycLevel: 1 },
      { isVerified: 1 }
    ]
  }
);

// --------------------
// Pre-save middleware
// --------------------
userSchema.pre("save", async function (next) {
  try {
    // Generate amstapay account number for new users
    if (this.isNew && !this.amstapayAccountNumber) {
      if (this.phoneNumber) {
        // Remove leading 0 and use phone number
        this.amstapayAccountNumber = this.phoneNumber.replace(/^0/, "");
      } else {
        // Generate random 10-digit number
        this.amstapayAccountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      }
    }

    // Hash password if modified
    if (this.isModified("password") && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 12);
    }

    // Hash PIN if modified and not null
    if (this.isModified("pin") && this.pin && !this.pin.startsWith('$2b$')) {
      this.pin = await bcrypt.hash(this.pin, 12);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// --------------------
// Instance Methods
// --------------------
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.comparePin = function (pin) {
  if (!this.pin) return false;
  return bcrypt.compare(pin, this.pin);
};

// Method to check if user can perform certain actions based on KYC level
userSchema.methods.canPerformAction = function(action) {
  const permissions = {
    'basic_transfer': 0,
    'large_transfer': 1,
    'business_operations': 2,
    'advanced_features': 3
  };
  
  return this.kycLevel >= (permissions[action] || 0);
};

// Method to get allowed fields based on account type
userSchema.methods.getAllowedFields = function() {
  const fieldMaps = {
    personal: [
      "fullName", "email", "phoneNumber", "dateOfBirth", "gender", 
      "residentialAddress", "bankName", "accountName", "accountNumber"
    ],
    business: [
      "fullName", "email", "phoneNumber", "businessName", "businessAddress", 
      "businessType", "bankName", "accountName", "accountNumber"
    ],
    agent: [
      "fullName", "email", "phoneNumber", "dateOfBirth", "gender", "residentialAddress",
      "bankName", "accountName", "accountNumber", "guarantorName", 
      "guarantorRelationship", "guarantorPhone", "guarantorAddress"
    ],
    enterprise: [
      "fullName", "email", "phoneNumber", "businessName", "businessAddress", 
      "businessType", "bankName", "accountName", "accountNumber"
    ],
    company: [
      "fullName", "email", "phoneNumber", "businessName", "businessAddress", 
      "businessType", "bankName", "accountName", "accountNumber"
    ]
  };
  
  return fieldMaps[this.accountType] || fieldMaps.personal;
};

module.exports = mongoose.model("User", userSchema);