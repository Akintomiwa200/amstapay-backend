// controllers/userController.js
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Allowed fields by account type
const allowedFields = {
  personal: ["fullName", "email", "phoneNumber", "dateOfBirth", "gender", "residentialAddress", "pin"],
  business: ["fullName", "email", "phoneNumber", "businessName", "businessAddress", "businessType", "pin"],
  agent: [
    "fullName", "email", "phoneNumber", "dateOfBirth", "gender", "residentialAddress",
    "bvnOrNin", "bankName", "accountName", "accountNumber",
    "guarantorName", "guarantorRelationship", "guarantorPhone", "guarantorAddress", "pin"
  ],
  enterprise: ["fullName", "email", "phoneNumber", "businessName", "businessAddress", "businessType", "pin"],
  company: ["fullName", "email", "phoneNumber", "businessName", "businessAddress", "businessType", "pin"],
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -pin");
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

    // Filter and hash updates
    const updates = {};
    for (const key of Object.keys(req.body)) {
      if (permitted.includes(key)) {
        if (key === "pin") {
          updates[key] = await bcrypt.hash(req.body[key], 10);
        } else {
          updates[key] = req.body[key];
        }
      }
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
    }).select("-password -pin");

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

// Change PIN
exports.changePin = async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPin, user.pin || "");
    if (!isMatch) {
      return res.status(400).json({ message: "Current PIN is incorrect" });
    }

    user.pin = await bcrypt.hash(newPin, 10);
    await user.save();

    res.json({ message: "PIN changed successfully" });
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

// Upload avatar
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Convert buffer to base64 or save to public folder
    const avatarPath = `/uploads/avatars/${req.user._id}_${Date.now()}.jpg`;
    const fullPath = path.join(__dirname, "..", "public", avatarPath);

    // Make sure folder exists
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });

    fs.writeFileSync(fullPath, req.file.buffer);

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { passportPhoto: avatarPath }, // store file path in DB
      { new: true }
    ).select("-password -pin");

    res.json({ message: "Profile image updated", avatar: avatarPath, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to upload avatar" });
  }
};



// Admin only: Get all users
exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const users = await User.find().select("-password -pin");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
