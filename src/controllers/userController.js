// // controllers/userController.js
// const fs = require("fs");
// const path = require("path");
// const User = require("../models/User");
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");

// // Allowed fields by account type
// const allowedFields = {
//   personal: [
//     "fullName", "email", "phoneNumber", "dateOfBirth", "gender", "residentialAddress", 
//     "bankName", "accountName", "accountNumber", "pin"
//   ],
//   business: [
//     "fullName", "email", "phoneNumber", "businessName", "businessAddress", "businessType", 
//     "bankName", "accountName", "accountNumber", "guarantorName", "guarantorRelationship", 
//     "guarantorPhone", "guarantorAddress", "pin"
//   ],
//   agent: [
//     "fullName", "email", "phoneNumber", "dateOfBirth", "gender", "residentialAddress",
//     "bvnOrNin", "bankName", "accountName", "accountNumber",
//     "guarantorName", "guarantorRelationship", "guarantorPhone", "guarantorAddress", "pin"
//   ],
//   enterprise: [
//     "fullName", "email", "phoneNumber", "businessName", "businessAddress", "businessType", 
//     "bankName", "accountName", "accountNumber", "guarantorName", "guarantorRelationship", 
//     "guarantorPhone", "guarantorAddress", "pin"
//   ],
//   company: [
//     "fullName", "email", "phoneNumber", "businessName", "businessAddress", "businessType", 
//     "bankName", "accountName", "accountNumber", "guarantorName", "guarantorRelationship", 
//     "guarantorPhone", "guarantorAddress", "pin"
//   ],
// };

// // Helper function to validate input
// const validateInput = (data, rules) => {
//   const errors = [];
  
//   if (rules.email && data.email) {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(data.email)) {
//       errors.push("Invalid email format");
//     }
//   }
  
//   if (rules.phoneNumber && data.phoneNumber) {
//     const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
//     if (!phoneRegex.test(data.phoneNumber)) {
//       errors.push("Invalid Nigerian phone number format");
//     }
//   }
  
//   if (rules.pin && data.pin) {
//     if (!/^\d{4,6}$/.test(data.pin)) {
//       errors.push("PIN must be 4-6 digits only");
//     }
//   }
  
//   if (rules.newPassword && data.newPassword) {
//     if (data.newPassword.length < 6) {
//       errors.push("Password must be at least 6 characters long");
//     }
//   }
  
//   return errors;
// };

// // Helper function to create standard response
// const createResponse = (success, message, data = null, statusCode = 200) => {
//   const response = { success, message };
//   if (data !== null) response.data = data;
//   return { response, statusCode };
// };

// // Get current user profile
// exports.getProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id).select("-password -pin -verificationCode");
//     if (!user) {
//       const { response, statusCode } = createResponse(false, "User not found", null, 404);
//       return res.status(statusCode).json(response);
//     }

//     // Filter response fields by account type but include core fields
//     const permitted = allowedFields[user.accountType] || [];
//     const filteredProfile = {};
    
//     // Always include core fields
//     const coreFields = [
//       "_id", "accountType", "kycLevel", "isVerified", "isOtpVerified", 
//       "createdAt", "updatedAt", "amstapayAccountNumber", "verifications",
//       "termsAgreed", "infoAccurate", "verificationConsent"
//     ];
    
//     [...permitted, ...coreFields].forEach(field => {
//       if (user[field] !== undefined) {
//         filteredProfile[field] = user[field];
//       }
//     });

//     const { response } = createResponse(true, "Profile retrieved successfully", filteredProfile);
//     res.json(response);
//   } catch (err) {
//     console.error("Get profile error:", err);
//     const { response, statusCode } = createResponse(false, "Server error", null, 500);
//     res.status(statusCode).json(response);
//   }
// };

// // Update user profile
// exports.updateProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id);
//     if (!user) {
//       const { response, statusCode } = createResponse(false, "User not found", null, 404);
//       return res.status(statusCode).json(response);
//     }

//     const accountType = user.accountType;
//     const permitted = allowedFields[accountType] || [];

//     // Validate input
//     const validationErrors = validateInput(req.body, {
//       email: true,
//       phoneNumber: true,
//       pin: true
//     });
    
//     if (validationErrors.length > 0) {
//       const { response, statusCode } = createResponse(false, validationErrors.join(", "), null, 400);
//       return res.status(statusCode).json(response);
//     }

//     // Check if email is already taken by another user
//     if (req.body.email && req.body.email !== user.email) {
//       const existingUser = await User.findOne({ 
//         email: req.body.email, 
//         _id: { $ne: req.user._id } 
//       });
//       if (existingUser) {
//         const { response, statusCode } = createResponse(false, "Email already in use", null, 400);
//         return res.status(statusCode).json(response);
//       }
//     }

//     // Check if phone number is already taken by another user
//     if (req.body.phoneNumber && req.body.phoneNumber !== user.phoneNumber) {
//       const existingUser = await User.findOne({ 
//         phoneNumber: req.body.phoneNumber, 
//         _id: { $ne: req.user._id } 
//       });
//       if (existingUser) {
//         const { response, statusCode } = createResponse(false, "Phone number already in use", null, 400);
//         return res.status(statusCode).json(response);
//       }
//     }

//     // Filter and process updates
//     const updates = {};
//     for (const key of Object.keys(req.body)) {
//       if (permitted.includes(key)) {
//         if (key === "pin") {
//           updates[key] = await bcrypt.hash(req.body[key], 12);
//         } else if (key === "dateOfBirth") {
//           updates[key] = new Date(req.body[key]);
//         } else {
//           updates[key] = req.body[key];
//         }
//       }
//     }

//     if (Object.keys(updates).length === 0) {
//       const { response, statusCode } = createResponse(false, "No valid fields provided for update", null, 400);
//       return res.status(statusCode).json(response);
//     }

//     const updatedUser = await User.findByIdAndUpdate(
//       req.user._id, 
//       { ...updates, updatedAt: new Date() }, 
//       { new: true, runValidators: true }
//     ).select("-password -pin -verificationCode");

//     const { response } = createResponse(true, "Profile updated successfully", updatedUser);
//     res.json(response);
//   } catch (err) {
//     console.error("Update profile error:", err);
//     if (err.name === 'ValidationError') {
//       const errors = Object.values(err.errors).map(e => e.message);
//       const { response, statusCode } = createResponse(false, errors.join(", "), null, 400);
//       return res.status(statusCode).json(response);
//     }
//     const { response, statusCode } = createResponse(false, "Server error", null, 500);
//     res.status(statusCode).json(response);
//   }
// };

// // Change password
// exports.changePassword = async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;
    
//     if (!currentPassword || !newPassword) {
//       const { response, statusCode } = createResponse(false, "Current password and new password are required", null, 400);
//       return res.status(statusCode).json(response);
//     }

//     const validationErrors = validateInput({ newPassword }, { newPassword: true });
//     if (validationErrors.length > 0) {
//       const { response, statusCode } = createResponse(false, validationErrors.join(", "), null, 400);
//       return res.status(statusCode).json(response);
//     }

//     const user = await User.findById(req.user._id);
//     if (!user) {
//       const { response, statusCode } = createResponse(false, "User not found", null, 404);
//       return res.status(statusCode).json(response);
//     }

//     const isMatch = await user.comparePassword(currentPassword);
//     if (!isMatch) {
//       const { response, statusCode } = createResponse(false, "Current password is incorrect", null, 400);
//       return res.status(statusCode).json(response);
//     }

//     if (currentPassword === newPassword) {
//       const { response, statusCode } = createResponse(false, "New password must be different from current password", null, 400);
//       return res.status(statusCode).json(response);
//     }

//     user.password = newPassword;
//     user.updatedAt = new Date();
//     await user.save();

//     const { response } = createResponse(true, "Password changed successfully");
//     res.json(response);
//   } catch (err) {
//     console.error("Change password error:", err);
//     const { response, statusCode } = createResponse(false, "Server error", null, 500);
//     res.status(statusCode).json(response);
//   }
// };

// // Change PIN
// exports.changePin = async (req, res) => {
//   try {
//     const { currentPin, newPin } = req.body;
    
//     if (!currentPin || !newPin) {
//       const { response, statusCode } = createResponse(false, "Current PIN and new PIN are required", null, 400);
//       return res.status(statusCode).json(response);
//     }

//     const validationErrors = validateInput({ pin: newPin }, { pin: true });
//     if (validationErrors.length > 0) {
//       const { response, statusCode } = createResponse(false, validationErrors.join(", "), null, 400);
//       return res.status(statusCode).json(response);
//     }

//     const user = await User.findById(req.user._id);
//     if (!user) {
//       const { response, statusCode } = createResponse(false, "User not found", null, 404);
//       return res.status(statusCode).json(response);
//     }

//     if (!user.pin) {
//       const { response, statusCode } = createResponse(false, "No PIN set for this account", null, 400);
//       return res.status(statusCode).json(response);
//     }

//     const isMatch = await bcrypt.compare(currentPin, user.pin);
//     if (!isMatch) {
//       const { response, statusCode } = createResponse(false, "Current PIN is incorrect", null, 400);
//       return res.status(statusCode).json(response);
//     }

//     if (currentPin === newPin) {
//       const { response, statusCode } = createResponse(false, "New PIN must be different from current PIN", null, 400);
//       return res.status(statusCode).json(response);
//     }

//     user.pin = await bcrypt.hash(newPin, 12);
//     user.updatedAt = new Date();
//     await user.save();

//     const { response } = createResponse(true, "PIN changed successfully");
//     res.json(response);
//   } catch (err) {
//     console.error("Change PIN error:", err);
//     const { response, statusCode } = createResponse(false, "Server error", null, 500);
//     res.status(statusCode).json(response);
//   }
// };

// // Upload avatar
// exports.uploadAvatar = async (req, res) => {
//   try {
//     if (!req.file) {
//       const { response, statusCode } = createResponse(false, "Please upload a valid image file", null, 400);
//       return res.status(statusCode).json(response);
//     }

//     // Validate file type
//     const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
//     if (!allowedMimes.includes(req.file.mimetype)) {
//       const { response, statusCode } = createResponse(false, "Please upload a valid image file (jpg, jpeg, png)", null, 400);
//       return res.status(statusCode).json(response);
//     }

//     // Validate file size (5MB max)
//     const maxSize = 5 * 1024 * 1024; // 5MB
//     if (req.file.size > maxSize) {
//       const { response, statusCode } = createResponse(false, "File too large. Maximum size is 5MB", null, 413);
//       return res.status(statusCode).json(response);
//     }

//     const fileExtension = path.extname(req.file.originalname);
//     const avatarPath = `/uploads/avatars/${req.user._id}_${Date.now()}${fileExtension}`;
//     const fullPath = path.join(__dirname, "..", "public", avatarPath);

//     // Make sure folder exists
//     fs.mkdirSync(path.dirname(fullPath), { recursive: true });

//     // Delete old avatar if exists
//     const user = await User.findById(req.user._id);
//     if (user.passportPhoto) {
//       const oldPath = path.join(__dirname, "..", "public", user.passportPhoto);
//       if (fs.existsSync(oldPath)) {
//         fs.unlinkSync(oldPath);
//       }
//     }

//     fs.writeFileSync(fullPath, req.file.buffer);

//     // Update user
//     const updatedUser = await User.findByIdAndUpdate(
//       req.user._id,
//       { 
//         passportPhoto: avatarPath,
//         updatedAt: new Date()
//       },
//       { new: true }
//     ).select("-password -pin -verificationCode");

//     const responseData = {
//       avatar: avatarPath,
//       user: updatedUser
//     };

//     const { response } = createResponse(true, "Profile image updated successfully", responseData);
//     res.json(response);
//   } catch (err) {
//     console.error("Upload avatar error:", err);
//     const { response, statusCode } = createResponse(false, "Failed to upload avatar", null, 500);
//     res.status(statusCode).json(response);
//   }
// };

// // Upload KYC Documents
// exports.uploadKYCDocuments = async (req, res) => {
//   try {
//     if (!req.files || Object.keys(req.files).length === 0) {
//       const { response, statusCode } = createResponse(false, "Please upload at least one KYC document", null, 400);
//       return res.status(statusCode).json(response);
//     }

//     const user = await User.findById(req.user._id);
//     if (!user) {
//       const { response, statusCode } = createResponse(false, "User not found", null, 404);
//       return res.status(statusCode).json(response);
//     }

//     const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
//     const maxSize = 10 * 1024 * 1024; // 10MB
//     const uploads = {};
//     const updates = {};

//     // Process each uploaded file
//     for (const [fieldName, files] of Object.entries(req.files)) {
//       if (!['idDocument', 'utilityBill', 'passportPhoto'].includes(fieldName)) {
//         continue;
//       }

//       const file = Array.isArray(files) ? files[0] : files;
      
//       // Validate file
//       if (!allowedMimes.includes(file.mimetype)) {
//         const { response, statusCode } = createResponse(false, `Invalid file type for ${fieldName}. Only JPG, PNG, PDF allowed`, null, 400);
//         return res.status(statusCode).json(response);
//       }

//       if (file.size > maxSize) {
//         const { response, statusCode } = createResponse(false, `File too large for ${fieldName}. Maximum size is 10MB`, null, 413);
//         return res.status(statusCode).json(response);
//       }

//       // Save file
//       const fileExtension = path.extname(file.originalname);
//       const fileName = `${req.user._id}_${fieldName}_${Date.now()}${fileExtension}`;
//       const filePath = `/uploads/kyc/${fieldName}/${fileName}`;
//       const fullPath = path.join(__dirname, "..", "public", filePath);

//       fs.mkdirSync(path.dirname(fullPath), { recursive: true });

//       // Delete old file if exists
//       if (user[fieldName]) {
//         const oldPath = path.join(__dirname, "..", "public", user[fieldName]);
//         if (fs.existsSync(oldPath)) {
//           fs.unlinkSync(oldPath);
//         }
//       }

//       fs.writeFileSync(fullPath, file.buffer);
//       uploads[fieldName] = filePath;
//       updates[fieldName] = filePath;
//     }

//     // Update KYC level based on uploaded documents
//     let newKycLevel = user.kycLevel || 0;
//     const documentsUploaded = Object.keys(uploads).length;
    
//     if (documentsUploaded >= 1 && newKycLevel < 1) newKycLevel = 1;
//     if (documentsUploaded >= 2 && newKycLevel < 2) newKycLevel = 2;
//     if (documentsUploaded >= 3 && newKycLevel < 3) newKycLevel = 3;

//     updates.kycLevel = newKycLevel;
//     updates.updatedAt = new Date();

//     await User.findByIdAndUpdate(req.user._id, updates);

//     const responseData = {
//       ...uploads,
//       kycLevel: newKycLevel,
//       documentsUploaded: Object.keys(uploads)
//     };

//     const { response } = createResponse(true, "KYC documents uploaded successfully", responseData);
//     res.json(response);
//   } catch (err) {
//     console.error("Upload KYC documents error:", err);
//     const { response, statusCode } = createResponse(false, "Failed to upload KYC documents", null, 500);
//     res.status(statusCode).json(response);
//   }
// };

// // Delete user account
// exports.deleteAccount = async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id);
//     if (!user) {
//       const { response, statusCode } = createResponse(false, "User not found", null, 404);
//       return res.status(statusCode).json(response);
//     }

//     // Log deletion reason if provided
//     const { reason, feedback } = req.body;
//     if (reason || feedback) {
//       console.log(`Account deletion - User: ${user.email}, Reason: ${reason || 'Not specified'}, Feedback: ${feedback || 'None'}`);
//     }

//     // Delete associated files
//     const filesToDelete = [user.passportPhoto, user.idDocument, user.utilityBill].filter(Boolean);
//     filesToDelete.forEach(filePath => {
//       const fullPath = path.join(__dirname, "..", "public", filePath);
//       if (fs.existsSync(fullPath)) {
//         fs.unlinkSync(fullPath);
//       }
//     });

//     await User.findByIdAndDelete(req.user._id);

//     const { response } = createResponse(true, "Account deleted successfully");
//     res.json(response);
//   } catch (err) {
//     console.error("Delete account error:", err);
//     const { response, statusCode } = createResponse(false, "Server error", null, 500);
//     res.status(statusCode).json(response);
//   }
// };

// // Admin only: Get all users with pagination and filtering
// exports.getAllUsers = async (req, res) => {
//   try {
//     // Check admin role
//     if (req.user.role !== "admin") {
//       const { response, statusCode } = createResponse(false, "Access denied. Admin privileges required.", null, 403);
//       return res.status(statusCode).json(response);
//     }

//     // Extract query parameters
//     const page = parseInt(req.query.page) || 1;
//     const limit = Math.min(parseInt(req.query.limit) || 10, 100);
//     const skip = (page - 1) * limit;
    
//     const { search, accountType, isVerified, kycLevel } = req.query;

//     // Build filter object
//     const filter = {};
    
//     if (search) {
//       filter.$or = [
//         { fullName: { $regex: search, $options: 'i' } },
//         { email: { $regex: search, $options: 'i' } },
//         { phoneNumber: { $regex: search, $options: 'i' } }
//       ];
//     }
    
//     if (accountType) filter.accountType = accountType;
//     if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
//     if (kycLevel !== undefined) filter.kycLevel = parseInt(kycLevel);

//     // Execute queries
//     const [users, totalUsers] = await Promise.all([
//       User.find(filter)
//         .select("-password -pin -verificationCode")
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit),
//       User.countDocuments(filter)
//     ]);

//     // Calculate pagination info
//     const totalPages = Math.ceil(totalUsers / limit);
//     const hasNext = page < totalPages;
//     const hasPrev = page > 1;

//     const responseData = {
//       users,
//       pagination: {
//         currentPage: page,
//         totalPages,
//         totalUsers,
//         hasNext,
//         hasPrev,
//         limit
//       }
//     };

//     const { response } = createResponse(true, "Users retrieved successfully", responseData);
//     res.json(response);
//   } catch (err) {
//     console.error("Get all users error:", err);
//     const { response, statusCode } = createResponse(false, "Server error", null, 500);
//     res.status(statusCode).json(response);
//   }
// };

// // Admin only: Get user by ID
// exports.getUserById = async (req, res) => {
//   try {
//     // Check admin role
//     if (req.user.role !== "admin") {
//       const { response, statusCode } = createResponse(false, "Access denied. Admin privileges required.", null, 403);
//       return res.status(statusCode).json(response);
//     }

//     const { userId } = req.params;
    
//     if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
//       const { response, statusCode } = createResponse(false, "Invalid user ID format", null, 400);
//       return res.status(statusCode).json(response);
//     }

//     const user = await User.findById(userId).select("-password -pin -verificationCode");
    
//     if (!user) {
//       const { response, statusCode } = createResponse(false, "User not found", null, 404);
//       return res.status(statusCode).json(response);
//     }

//     const { response } = createResponse(true, "User found successfully", user);
//     res.json(response);
//   } catch (err) {
//     console.error("Get user by ID error:", err);
//     const { response, statusCode } = createResponse(false, "Server error", null, 500);
//     res.status(statusCode).json(response);
//   }
// };



// controllers/userController.js
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Allowed fields by account type
const allowedFields = {
  personal: [
    "fullName", "email", "phoneNumber", "dateOfBirth", "gender", "residentialAddress", 
    "bankName", "accountName", "accountNumber", "pin"
  ],
  business: [
    "fullName", "email", "phoneNumber", "businessName", "businessAddress", "businessType", 
    "bankName", "accountName", "accountNumber", "guarantorName", "guarantorRelationship", 
    "guarantorPhone", "guarantorAddress", "pin"
  ],
  agent: [
    "fullName", "email", "phoneNumber", "dateOfBirth", "gender", "residentialAddress",
    "bvnOrNin", "bankName", "accountName", "accountNumber",
    "guarantorName", "guarantorRelationship", "guarantorPhone", "guarantorAddress", "pin"
  ],
  enterprise: [
    "fullName", "email", "phoneNumber", "businessName", "businessAddress", "businessType", 
    "bankName", "accountName", "accountNumber", "guarantorName", "guarantorRelationship", 
    "guarantorPhone", "guarantorAddress", "pin"
  ],
  company: [
    "fullName", "email", "phoneNumber", "businessName", "businessAddress", "businessType", 
    "bankName", "accountName", "accountNumber", "guarantorName", "guarantorRelationship", 
    "guarantorPhone", "guarantorAddress", "pin"
  ],
};

// Helper function to validate input
const validateInput = (data, rules) => {
  const errors = [];
  
  if (rules.email && data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push("Invalid email format");
    }
  }
  
  if (rules.phoneNumber && data.phoneNumber) {
    const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
    if (!phoneRegex.test(data.phoneNumber)) {
      errors.push("Invalid Nigerian phone number format");
    }
  }
  
  if (rules.pin && data.pin) {
    if (!/^\d{4,6}$/.test(data.pin)) {
      errors.push("PIN must be 4-6 digits only");
    }
  }
  
  if (rules.newPassword && data.newPassword) {
    if (data.newPassword.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }
  }
  
  return errors;
};

// Helper function to create standard response
const createResponse = (success, message, data = null, statusCode = 200) => {
  const response = { success, message };
  if (data !== null) response.data = data;
  return { response, statusCode };
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      const { response, statusCode } = createResponse(false, "Invalid user session", null, 401);
      return res.status(statusCode).json(response);
    }

    const user = await User.findById(req.user._id).select("-password -pin -verificationCode -otpCode -resetPasswordCode");
    if (!user) {
      const { response, statusCode } = createResponse(false, "User not found", null, 404);
      return res.status(statusCode).json(response);
    }

    // Return complete user profile (removing sensitive fields only)
    const userProfile = user.toObject();
    
    // Remove any remaining sensitive fields
    delete userProfile.password;
    delete userProfile.pin;
    delete userProfile.verificationCode;
    delete userProfile.otpCode;
    delete userProfile.resetPasswordCode;

    const { response } = createResponse(true, "Profile retrieved successfully", userProfile);
    res.json(response);
  } catch (err) {
    console.error("Get profile error:", err);
    const { response, statusCode } = createResponse(false, "Server error", null, 500);
    res.status(statusCode).json(response);
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      const { response, statusCode } = createResponse(false, "User not found", null, 404);
      return res.status(statusCode).json(response);
    }

    const accountType = user.accountType;
    const permitted = allowedFields[accountType] || [];

    // Validate input
    const validationErrors = validateInput(req.body, {
      email: true,
      phoneNumber: true,
      pin: true
    });
    
    if (validationErrors.length > 0) {
      const { response, statusCode } = createResponse(false, validationErrors.join(", "), null, 400);
      return res.status(statusCode).json(response);
    }

    // Check if email is already taken by another user
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ 
        email: req.body.email, 
        _id: { $ne: req.user._id } 
      });
      if (existingUser) {
        const { response, statusCode } = createResponse(false, "Email already in use", null, 400);
        return res.status(statusCode).json(response);
      }
    }

    // Check if phone number is already taken by another user
    if (req.body.phoneNumber && req.body.phoneNumber !== user.phoneNumber) {
      const existingUser = await User.findOne({ 
        phoneNumber: req.body.phoneNumber, 
        _id: { $ne: req.user._id } 
      });
      if (existingUser) {
        const { response, statusCode } = createResponse(false, "Phone number already in use", null, 400);
        return res.status(statusCode).json(response);
      }
    }

    // Filter and process updates
    const updates = {};
    for (const key of Object.keys(req.body)) {
      if (permitted.includes(key)) {
        if (key === "pin") {
          updates[key] = await bcrypt.hash(req.body[key], 12);
        } else if (key === "dateOfBirth") {
          updates[key] = new Date(req.body[key]);
        } else {
          updates[key] = req.body[key];
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      const { response, statusCode } = createResponse(false, "No valid fields provided for update", null, 400);
      return res.status(statusCode).json(response);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id, 
      { ...updates, updatedAt: new Date() }, 
      { new: true, runValidators: true }
    ).select("-password -pin -verificationCode");

    const { response } = createResponse(true, "Profile updated successfully", updatedUser);
    res.json(response);
  } catch (err) {
    console.error("Update profile error:", err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      const { response, statusCode } = createResponse(false, errors.join(", "), null, 400);
      return res.status(statusCode).json(response);
    }
    const { response, statusCode } = createResponse(false, "Server error", null, 500);
    res.status(statusCode).json(response);
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      const { response, statusCode } = createResponse(false, "Current password and new password are required", null, 400);
      return res.status(statusCode).json(response);
    }

    const validationErrors = validateInput({ newPassword }, { newPassword: true });
    if (validationErrors.length > 0) {
      const { response, statusCode } = createResponse(false, validationErrors.join(", "), null, 400);
      return res.status(statusCode).json(response);
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      const { response, statusCode } = createResponse(false, "User not found", null, 404);
      return res.status(statusCode).json(response);
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      const { response, statusCode } = createResponse(false, "Current password is incorrect", null, 400);
      return res.status(statusCode).json(response);
    }

    if (currentPassword === newPassword) {
      const { response, statusCode } = createResponse(false, "New password must be different from current password", null, 400);
      return res.status(statusCode).json(response);
    }

    user.password = newPassword;
    user.updatedAt = new Date();
    await user.save();

    const { response } = createResponse(true, "Password changed successfully");
    res.json(response);
  } catch (err) {
    console.error("Change password error:", err);
    const { response, statusCode } = createResponse(false, "Server error", null, 500);
    res.status(statusCode).json(response);
  }
};

// Change PIN
exports.changePin = async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    
    if (!currentPin || !newPin) {
      const { response, statusCode } = createResponse(false, "Current PIN and new PIN are required", null, 400);
      return res.status(statusCode).json(response);
    }

    const validationErrors = validateInput({ pin: newPin }, { pin: true });
    if (validationErrors.length > 0) {
      const { response, statusCode } = createResponse(false, validationErrors.join(", "), null, 400);
      return res.status(statusCode).json(response);
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      const { response, statusCode } = createResponse(false, "User not found", null, 404);
      return res.status(statusCode).json(response);
    }

    if (!user.pin) {
      const { response, statusCode } = createResponse(false, "No PIN set for this account", null, 400);
      return res.status(statusCode).json(response);
    }

    const isMatch = await bcrypt.compare(currentPin, user.pin);
    if (!isMatch) {
      const { response, statusCode } = createResponse(false, "Current PIN is incorrect", null, 400);
      return res.status(statusCode).json(response);
    }

    if (currentPin === newPin) {
      const { response, statusCode } = createResponse(false, "New PIN must be different from current PIN", null, 400);
      return res.status(statusCode).json(response);
    }

    user.pin = await bcrypt.hash(newPin, 12);
    user.updatedAt = new Date();
    await user.save();

    const { response } = createResponse(true, "PIN changed successfully");
    res.json(response);
  } catch (err) {
    console.error("Change PIN error:", err);
    const { response, statusCode } = createResponse(false, "Server error", null, 500);
    res.status(statusCode).json(response);
  }
};

// Upload avatar
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      const { response, statusCode } = createResponse(false, "Please upload a valid image file", null, 400);
      return res.status(statusCode).json(response);
    }

    // Validate file type
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      const { response, statusCode } = createResponse(false, "Please upload a valid image file (jpg, jpeg, png)", null, 400);
      return res.status(statusCode).json(response);
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      const { response, statusCode } = createResponse(false, "File too large. Maximum size is 5MB", null, 413);
      return res.status(statusCode).json(response);
    }

    const fileExtension = path.extname(req.file.originalname);
    const avatarPath = `/uploads/avatars/${req.user._id}_${Date.now()}${fileExtension}`;
    const fullPath = path.join(__dirname, "..", "public", avatarPath);

    // Make sure folder exists
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });

    // Delete old avatar if exists
    const user = await User.findById(req.user._id);
    if (user.passportPhoto) {
      const oldPath = path.join(__dirname, "..", "public", user.passportPhoto);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    fs.writeFileSync(fullPath, req.file.buffer);

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { 
        passportPhoto: avatarPath,
        updatedAt: new Date()
      },
      { new: true }
    ).select("-password -pin -verificationCode");

    const responseData = {
      avatar: avatarPath,
      user: updatedUser
    };

    const { response } = createResponse(true, "Profile image updated successfully", responseData);
    res.json(response);
  } catch (err) {
    console.error("Upload avatar error:", err);
    const { response, statusCode } = createResponse(false, "Failed to upload avatar", null, 500);
    res.status(statusCode).json(response);
  }
};

// Upload KYC Documents
exports.uploadKYCDocuments = async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      const { response, statusCode } = createResponse(false, "Please upload at least one KYC document", null, 400);
      return res.status(statusCode).json(response);
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      const { response, statusCode } = createResponse(false, "User not found", null, 404);
      return res.status(statusCode).json(response);
    }

    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const uploads = {};
    const updates = {};

    // Process each uploaded file
    for (const [fieldName, files] of Object.entries(req.files)) {
      if (!['idDocument', 'utilityBill', 'passportPhoto'].includes(fieldName)) {
        continue;
      }

      const file = Array.isArray(files) ? files[0] : files;
      
      // Validate file
      if (!allowedMimes.includes(file.mimetype)) {
        const { response, statusCode } = createResponse(false, `Invalid file type for ${fieldName}. Only JPG, PNG, PDF allowed`, null, 400);
        return res.status(statusCode).json(response);
      }

      if (file.size > maxSize) {
        const { response, statusCode } = createResponse(false, `File too large for ${fieldName}. Maximum size is 10MB`, null, 413);
        return res.status(statusCode).json(response);
      }

      // Save file
      const fileExtension = path.extname(file.originalname);
      const fileName = `${req.user._id}_${fieldName}_${Date.now()}${fileExtension}`;
      const filePath = `/uploads/kyc/${fieldName}/${fileName}`;
      const fullPath = path.join(__dirname, "..", "public", filePath);

      fs.mkdirSync(path.dirname(fullPath), { recursive: true });

      // Delete old file if exists
      if (user[fieldName]) {
        const oldPath = path.join(__dirname, "..", "public", user[fieldName]);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      fs.writeFileSync(fullPath, file.buffer);
      uploads[fieldName] = filePath;
      updates[fieldName] = filePath;
    }

    // Update KYC level based on uploaded documents
    let newKycLevel = user.kycLevel || 0;
    const documentsUploaded = Object.keys(uploads).length;
    
    if (documentsUploaded >= 1 && newKycLevel < 1) newKycLevel = 1;
    if (documentsUploaded >= 2 && newKycLevel < 2) newKycLevel = 2;
    if (documentsUploaded >= 3 && newKycLevel < 3) newKycLevel = 3;

    updates.kycLevel = newKycLevel;
    updates.updatedAt = new Date();

    await User.findByIdAndUpdate(req.user._id, updates);

    const responseData = {
      ...uploads,
      kycLevel: newKycLevel,
      documentsUploaded: Object.keys(uploads)
    };

    const { response } = createResponse(true, "KYC documents uploaded successfully", responseData);
    res.json(response);
  } catch (err) {
    console.error("Upload KYC documents error:", err);
    const { response, statusCode } = createResponse(false, "Failed to upload KYC documents", null, 500);
    res.status(statusCode).json(response);
  }
};

// Delete user account
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      const { response, statusCode } = createResponse(false, "User not found", null, 404);
      return res.status(statusCode).json(response);
    }

    // Log deletion reason if provided
    const { reason, feedback } = req.body;
    if (reason || feedback) {
      console.log(`Account deletion - User: ${user.email}, Reason: ${reason || 'Not specified'}, Feedback: ${feedback || 'None'}`);
    }

    // Delete associated files
    const filesToDelete = [user.passportPhoto, user.idDocument, user.utilityBill].filter(Boolean);
    filesToDelete.forEach(filePath => {
      const fullPath = path.join(__dirname, "..", "public", filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });

    await User.findByIdAndDelete(req.user._id);

    const { response } = createResponse(true, "Account deleted successfully");
    res.json(response);
  } catch (err) {
    console.error("Delete account error:", err);
    const { response, statusCode } = createResponse(false, "Server error", null, 500);
    res.status(statusCode).json(response);
  }
};

// Admin only: Get all users with pagination and filtering
exports.getAllUsers = async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== "admin") {
      const { response, statusCode } = createResponse(false, "Access denied. Admin privileges required.", null, 403);
      return res.status(statusCode).json(response);
    }

    // Extract query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;
    
    const { search, accountType, isVerified, kycLevel } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (accountType) filter.accountType = accountType;
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    if (kycLevel !== undefined) filter.kycLevel = parseInt(kycLevel);

    // Execute queries
    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select("-password -pin -verificationCode")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalUsers / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const responseData = {
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNext,
        hasPrev,
        limit
      }
    };

    const { response } = createResponse(true, "Users retrieved successfully", responseData);
    res.json(response);
  } catch (err) {
    console.error("Get all users error:", err);
    const { response, statusCode } = createResponse(false, "Server error", null, 500);
    res.status(statusCode).json(response);
  }
};

// Admin only: Get user by ID
exports.getUserById = async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== "admin") {
      const { response, statusCode } = createResponse(false, "Access denied. Admin privileges required.", null, 403);
      return res.status(statusCode).json(response);
    }

    const { userId } = req.params;
    
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      const { response, statusCode } = createResponse(false, "Invalid user ID format", null, 400);
      return res.status(statusCode).json(response);
    }

    const user = await User.findById(userId).select("-password -pin -verificationCode");
    
    if (!user) {
      const { response, statusCode } = createResponse(false, "User not found", null, 404);
      return res.status(statusCode).json(response);
    }

    const { response } = createResponse(true, "User found successfully", user);
    res.json(response);
  } catch (err) {
    console.error("Get user by ID error:", err);
    const { response, statusCode } = createResponse(false, "Server error", null, 500);
    res.status(statusCode).json(response);
  }
};