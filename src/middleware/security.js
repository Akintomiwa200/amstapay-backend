const User = require("../models/User");
const Wallet = require("../models/Wallet");
const AuditLog = require("../models/AuditLog");

exports.requirePin = (action) => {
  return async (req, res, next) => {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ message: "Transaction PIN required" });

    try {
      const user = await User.findById(req.user._id).select("+pin");
      if (!user) return res.status(401).json({ message: "User not found" });

      const isValid = await user.comparePin(pin);
      if (!isValid) {
        await AuditLog.create({
          user: user._id, action: "pin_failed", resource: action, ip: req.ip,
          userAgent: req.get("User-Agent"), success: false,
        });
        return res.status(403).json({ message: "Invalid transaction PIN" });
      }

      next();
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
};

exports.requireKYCLevel = (level) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(401).json({ message: "User not found" });
      if (user.kycLevel < level) {
        return res.status(403).json({
          message: `KYC level ${level} required. Your level: ${user.kycLevel}`,
          requiredLevel: level,
          currentLevel: user.kycLevel,
        });
      }
      next();
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
};

exports.require2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.twoFactorEnabled) {
      const { twoFactorCode } = req.body;
      if (!twoFactorCode) {
        return res.status(403).json({ message: "2FA code required", requires2FA: true });
      }
      const { authenticator } = require("otplib");
      const isValid = authenticator.verify({ token: twoFactorCode, secret: user.twoFactorSecret });
      if (!isValid) {
        return res.status(403).json({ message: "Invalid 2FA code" });
      }
    }
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.checkSuspicious = async (req, res, next) => {
  try {
    const recentFailures = await AuditLog.countDocuments({
      user: req.user._id,
      success: false,
      createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) },
    });

    if (recentFailures >= 5) {
      return res.status(429).json({
        message: "Suspicious activity detected. Account temporarily restricted. Contact support.",
        code: "ACCOUNT_TEMP_RESTRICTED",
      });
    }

    const ipFailures = await AuditLog.countDocuments({
      ip: req.ip,
      action: { $regex: /login|pin/ },
      success: false,
      createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) },
    });

    if (ipFailures >= 10) {
      return res.status(429).json({
        message: "Too many failed attempts from this IP. Try again later.",
        code: "IP_TEMP_BLOCKED",
      });
    }

    next();
  } catch (err) {
    next();
  }
};

exports.largeTransactionAlert = (threshold = 500000) => {
  return async (req, res, next) => {
    const { amount } = req.body;
    if (amount && amount >= threshold) {
      await AuditLog.create({
        user: req.user._id, action: "large_transaction", resource: req.baseUrl,
        details: { amount, threshold }, ip: req.ip, userAgent: req.get("User-Agent"),
        success: true,
      });
    }
    next();
  };
};

exports.validateWebhookSignature = (secret) => {
  return (req, res, next) => {
    const crypto = require("crypto");
    const signature = req.headers["x-paystack-signature"];
    if (!signature) return res.status(401).json({ message: "Missing signature" });

    const hash = crypto.createHmac("sha512", secret).update(JSON.stringify(req.body)).digest("hex");
    if (hash !== signature) return res.status(401).json({ message: "Invalid signature" });

    next();
  };
};
