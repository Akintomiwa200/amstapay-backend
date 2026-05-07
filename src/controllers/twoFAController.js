const { authenticator } = require("otplib");
const User = require("../models/User");

exports.setup2FA = async (req, res) => {
  try {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(req.user.email || req.user.phoneNumber, "AmstaPay", secret);
    req.user.twoFactorSecret = secret;
    await req.user.save();
    res.json({ success: true, data: { secret, otpauth } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyAndEnable2FA = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token required" });
    if (!req.user.twoFactorSecret) return res.status(400).json({ message: "Setup 2FA first" });
    const isValid = authenticator.check(token, req.user.twoFactorSecret);
    if (!isValid) return res.status(400).json({ message: "Invalid token" });
    req.user.twoFactorEnabled = true;
    await req.user.save();
    res.json({ success: true, message: "2FA enabled successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.disable2FA = async (req, res) => {
  try {
    const { token } = req.body;
    if (!req.user.twoFactorEnabled) return res.status(400).json({ message: "2FA not enabled" });
    if (token) {
      const isValid = authenticator.check(token, req.user.twoFactorSecret);
      if (!isValid) return res.status(400).json({ message: "Invalid token" });
    }
    req.user.twoFactorEnabled = false;
    req.user.twoFactorSecret = null;
    await req.user.save();
    res.json({ success: true, message: "2FA disabled" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.get2FAStatus = async (req, res) => {
  res.json({
    success: true,
    data: { enabled: req.user.twoFactorEnabled, setup: !!req.user.twoFactorSecret },
  });
};
