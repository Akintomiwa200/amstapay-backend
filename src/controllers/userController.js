const User = require("../models/User");
const jwt = require("jsonwebtoken");


// allowed fields by account type
const allowedFields = {
  personal: ["fullName", "email", "phoneNumber", "dateOfBirth", "gender", "residentialAddress"],
  business: ["fullName", "email", "phoneNumber", "businessName", "businessAddress", "businessType"],
  agent: ["fullName", "email", "phoneNumber", "dateOfBirth", "gender", "residentialAddress", "bvnOrNin", "bankName", "accountName", "accountNumber", "guarantorName", "guarantorRelationship", "guarantorPhone", "guarantorAddress"],
  enterprise: ["fullName", "email", "phoneNumber", "businessName", "businessAddress", "businessType"],
  company: ["fullName", "email", "phoneNumber", "businessName", "businessAddress", "businessType"],
};


// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Filter response fields by account type
    const permitted = allowedFields[user.accountType] || [];
    const filteredProfile = {};
    for (const field of permitted) {
      filteredProfile[field] = user[field];
    }

    // Always return some core fields
    filteredProfile._id = user._id;
    filteredProfile.accountType = user.accountType;
    filteredProfile.kycLevel = user.kycLevel;
    filteredProfile.isOtpVerified = user.isOtpVerified;

    res.json(filteredProfile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const accountType = user.accountType;
    const permitted = allowedFields[accountType] || [];
    
    // Filter updates
    const updates = {};
    for (const key of Object.keys(req.body)) {
      if (permitted.includes(key)) {
        updates[key] = req.body[key];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
    }).select("-password");

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// Delete user account
exports.deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin only: Get all users
exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
