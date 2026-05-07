const jwt = require("jsonwebtoken");
const User = require("../models/User");

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found or inactive" });
    }

    if (req.user.lockoutUntil && req.user.lockoutUntil > new Date()) {
      const remaining = Math.ceil((req.user.lockoutUntil - new Date()) / 60000);
      return res.status(423).json({
        message: `Account locked. Try again in ${remaining} minute(s)`,
        lockedUntil: req.user.lockoutUntil,
      });
    }

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

exports.checkLockout = async (identifier) => {
  const AuditLog = require("../models/AuditLog");
  const recent = await AuditLog.countDocuments({
    $or: [{ "details.email": identifier }, { "details.phoneNumber": identifier }],
    action: "login_failed",
    createdAt: { $gte: new Date(Date.now() - LOCKOUT_DURATION_MINUTES * 60 * 1000) },
  });
  return recent >= MAX_LOGIN_ATTEMPTS;
};

exports.applyLockout = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    lockoutUntil: new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000),
    loginAttempts: 0,
  });
};

exports.resetLockout = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    lockoutUntil: null,
    loginAttempts: 0,
  });
};

exports.LOCKOUT_DURATION_MINUTES = LOCKOUT_DURATION_MINUTES;
