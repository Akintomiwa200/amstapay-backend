// // middleware/auth.js
// const jwt = require("jsonwebtoken");
// const User = require("../models/User");

// exports.protect = async (req, res, next) => {
//   let token;

//   // Check for Authorization header
//   if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
//     token = req.headers.authorization.split(" ")[1];
//   }

//   if (!token) {
//     return res.status(401).json({ message: "Not authorized, no token" });
//   }

//   try {
//     // Verify token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // Attach user to request (excluding password)
//     req.user = await User.findById(decoded.id).select("-password");

//     if (!req.user) {
//       return res.status(401).json({ message: "User not found or inactive" });
//     }

//     next();
//   } catch (err) {
//     console.error("❌ Auth error:", err.message);
//     res.status(401).json({ message: "Not authorized, token failed" });
//   }
// };


// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  let token;

  try {
    // Check for Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "Access denied. No token provided." 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.id) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid token format" 
      });
    }

    // Attach user to request (excluding sensitive fields)
    const user = await User.findById(decoded.id).select("-password -pin -verificationCode -otpCode -resetPasswordCode");
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "User not found or account deactivated" 
      });
    }

    // Check if user account is active
    if (user.isDeleted) {
      return res.status(401).json({ 
        success: false,
        message: "Account has been deactivated" 
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("❌ Auth error:", err.message);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: "Invalid token" 
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: "Token expired. Please login again." 
      });
    }
    
    return res.status(401).json({ 
      success: false,
      message: "Authentication failed" 
    });
  }
};