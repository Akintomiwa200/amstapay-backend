const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const AuditLog = require("../models/AuditLog");
const LoginAttempt = require("../models/LoginAttempt");
const DeviceSession = require("../models/DeviceSession");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendVerificationCodeEmail, sendWelcomeEmail, sendResetPinEmail, sendPinResetSuccessEmail } = require("../services/emailService");
const { sendOTP } = require("../services/customNotificationService");
const { checkLockout, applyLockout, resetLockout } = require("../middleware/auth");
const encryptionService = require("../services/encryptionService");

const audit = (action, details = {}) => async (req, user, success = true) => {
  return AuditLog.create({
    user: user?._id,
    action,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    deviceId: req.headers["x-device-id"],
    details,
    success,
  }).catch(() => {});
};

const getDeviceInfo = (req) => ({
  deviceId: req.headers["x-device-id"] || crypto.randomBytes(16).toString("hex"),
  deviceName: req.headers["x-device-name"] || "Unknown Device",
  userAgent: req.get("User-Agent"),
  ip: req.ip,
});

exports.signup = async (req, res) => {
  const { fullName, email, phoneNumber, password, pin, accountType, ...rest } = req.body;
  try {
    const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existingUser) return res.status(400).json({ error: "Email or phone already in use" });

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000);

    const user = new User({ fullName, email, phoneNumber, password, pin, accountType, verificationCode, codeExpires, ...rest });
    await user.save();

    await sendVerificationCodeEmail(email, fullName, verificationCode);
    if (phoneNumber) {
      await sendOTP({ userId: user._id, email, phone: phoneNumber, fullName, code: verificationCode });
    }

    await audit("signup")(req, user);
    res.status(201).json({ message: "Signup successful, verification code sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "User already verified" });
    if (String(user.verificationCode) !== String(code) || user.codeExpires < Date.now()) {
      await audit("verify_email_failed")(req, user, false);
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.codeExpires = null;
    await user.save();

    await sendWelcomeEmail(user.email, user.fullName);
    await audit("verify_email")(req, user);
    res.json({ message: "Email verified successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }],
    });

    if (!user) {
      await AuditLog.create({ action: "login_failed", details: { emailOrPhone }, ip: req.ip, userAgent: req.get("User-Agent"), success: false });
      return res.status(404).json({ message: "User not found" });
    }

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remaining = Math.ceil((user.lockoutUntil - new Date()) / 60000);
      await audit("login_blocked_locked")(req, user, false);
      return res.status(423).json({ message: `Account locked. Try again in ${remaining} minute(s)`, lockedUntil: user.lockoutUntil });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await LoginAttempt.create({ user: user._id, identifier: emailOrPhone, ip: req.ip, userAgent: req.get("User-Agent"), success: false, failureReason: "wrong_password" });
      await audit("login_failed")(req, user, false);

      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        await applyLockout(user._id);
        return res.status(423).json({ message: "Account locked due to too many failed attempts. Try again in 30 minutes." });
      }
      await user.save();
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email first" });
    }

    const deviceInfo = getDeviceInfo(req);
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });

    const refreshTokenValue = crypto.randomBytes(40).toString("hex");
    const refreshTokenHash = encryptionService.hashToken(refreshTokenValue);

    await RefreshToken.create({
      user: user._id, token: refreshTokenValue,
      expiresAt: new Date(Date.now() + 30 * 86400000),
      userAgent: req.headers["user-agent"] || "",
      ipAddress: req.ip,
    });

    await DeviceSession.create({
      user: user._id,
      deviceId: deviceInfo.deviceId,
      deviceName: deviceInfo.deviceName,
      ip: deviceInfo.ip,
      userAgent: deviceInfo.userAgent,
      refreshTokenHash,
      isActive: true,
      lastActiveAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 86400000),
    });

    await LoginAttempt.create({ user: user._id, identifier: emailOrPhone, ip: req.ip, userAgent: req.get("User-Agent"), success: true });
    await resetLockout(user._id);
    await audit("login")(req, user);

    res.json({
      message: "Login successful",
      token,
      refreshToken: refreshTokenValue,
      expiresIn: "24h",
      deviceId: deviceInfo.deviceId,
      user: { id: user._id, fullName: user.fullName, email: user.email, amstapayAccountNumber: user.amstapayAccountNumber, kycLevel: user.kycLevel },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { emailOrPhone } = req.body;
    const user = await User.findOne({ $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }] });
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    if (user.email) await sendVerificationCodeEmail(user.email, user.fullName, resetCode);
    await audit("forgot_password")(req, user);
    res.json({ message: "Password reset code sent successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyResetCode = async (req, res) => {
  try {
    const { emailOrPhone, code } = req.body;
    const user = await User.findOne({ $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }] });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.resetPasswordCode || String(user.resetPasswordCode) !== String(code) || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }
    res.json({ message: "Code verified. You can now reset your password." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { emailOrPhone, code, newPassword } = req.body;
    const user = await User.findOne({ $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }] });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.resetPasswordCode || String(user.resetPasswordCode) !== String(code) || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    user.password = newPassword;
    user.resetPasswordCode = null;
    user.resetPasswordExpires = null;
    await user.save();

    await RefreshToken.updateMany({ user: user._id, revokedAt: null }, { revokedAt: new Date() });
    await DeviceSession.updateMany({ user: user._id, isActive: true }, { isActive: false, loggedOutAt: new Date() });

    await audit("reset_password")(req, user);
    res.json({ message: "Password reset successful. All sessions logged out." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.forgotPin = async (req, res) => {
  try {
    const { emailOrPhone } = req.body;
    const user = await User.findOne({ $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }] });
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPinCode = resetCode;
    user.resetPinExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    if (user.email) await sendResetPinEmail(user.email, user.fullName, resetCode);
    await audit("forgot_pin")(req, user);
    res.json({ message: "Verification mail sent successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyPinResetCode = async (req, res) => {
  try {
    const { emailOrPhone, code } = req.body;
    const user = await User.findOne({ $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }] });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.resetPinCode || String(user.resetPinCode) !== String(code) || user.resetPinExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }
    res.json({ message: "Mail verified successfully. You can now reset your PIN." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resetPin = async (req, res) => {
  try {
    const { emailOrPhone, code, newPin } = req.body;
    const user = await User.findOne({ $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }] });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.resetPinCode || String(user.resetPinCode) !== String(code) || user.resetPinExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    user.pin = newPin;
    user.resetPinCode = null;
    user.resetPinExpires = null;
    await user.save();

    if (user.email) await sendPinResetSuccessEmail(user.email, user.fullName);
    await audit("reset_pin")(req, user);
    res.json({ message: "Transaction PIN reset successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.changePin = async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.comparePin(currentPin);
    if (!isMatch) {
      await audit("change_pin_failed")(req, user, false);
      return res.status(400).json({ message: "Current PIN is incorrect" });
    }

    user.pin = newPin;
    await user.save();

    await audit("change_pin")(req, user);
    res.json({ message: "PIN changed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken: token, deviceId } = req.body;
    if (!token) return res.status(400).json({ message: "Refresh token required" });

    const stored = await RefreshToken.findOne({ token, revokedAt: null });
    if (!stored || stored.expiresAt < new Date()) {
      await AuditLog.create({ action: "refresh_token_failed", ip: req.ip, userAgent: req.get("User-Agent"), success: false });
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    stored.revokedAt = new Date();
    await stored.save();

    const newToken = jwt.sign({ id: stored.user }, process.env.JWT_SECRET, { expiresIn: "24h" });
    const newRefreshToken = crypto.randomBytes(40).toString("hex");
    const refreshTokenHash = encryptionService.hashToken(newRefreshToken);

    await RefreshToken.create({
      user: stored.user, token: newRefreshToken,
      expiresAt: new Date(Date.now() + 30 * 86400000),
      userAgent: req.headers["user-agent"] || "",
      ipAddress: req.ip,
    });

    if (deviceId) {
      await DeviceSession.findOneAndUpdate(
        { user: stored.user, deviceId },
        { refreshTokenHash, lastActiveAt: new Date() },
      );
    }

    return res.json({ token: newToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken: token, deviceId } = req.body;
    if (token) await RefreshToken.updateOne({ token }, { revokedAt: new Date() });
    if (deviceId) {
      await DeviceSession.findOneAndUpdate(
        { user: req.user?._id, deviceId },
        { isActive: false, loggedOutAt: new Date() },
      );
    }
    await audit("logout")(req, req.user);
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSessions = async (req, res) => {
  try {
    const sessions = await DeviceSession.find({ user: req.user._id, isActive: true })
      .select("deviceId deviceName ip lastActiveAt createdAt")
      .sort({ lastActiveAt: -1 });
    res.json({ success: true, count: sessions.length, data: sessions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.revokeSession = async (req, res) => {
  try {
    const { deviceId } = req.params;
    await DeviceSession.findOneAndUpdate(
      { user: req.user._id, deviceId },
      { isActive: false, loggedOutAt: new Date() },
    );
    await RefreshToken.updateMany(
      { user: req.user._id, revokedAt: null },
      { revokedAt: new Date() },
    );
    await audit("revoke_session")(req, req.user);
    res.json({ message: "Session revoked" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      await audit("change_password_failed")(req, user, false);
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    await RefreshToken.updateMany({ user: user._id, revokedAt: null }, { revokedAt: new Date() });
    await DeviceSession.updateMany({ user: user._id, isActive: true }, { isActive: false, loggedOutAt: new Date() });

    await audit("change_password")(req, user);
    res.json({ message: "Password changed. All other sessions logged out." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
