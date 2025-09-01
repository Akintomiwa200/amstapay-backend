const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { 
  sendVerificationCodeEmail, 
  sendWelcomeEmail,
  sendResetPinEmail,
  sendPinResetSuccessEmail
} = require("../services/emailService");

// --------------------
// Signup
// --------------------
exports.signup = async (req, res) => {
  const { fullName, email, phoneNumber, password, accountType, ...rest } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existingUser) return res.status(400).json({ error: "Email or phone already in use" });

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000);

    const user = new User({
      fullName,
      email,
      phoneNumber,
      password,
      accountType,
      verificationCode,
      codeExpires,
      ...rest,
    });

    await user.save();
    await sendVerificationCodeEmail(email, fullName, verificationCode);

    res.status(201).json({ message: "Signup successful, verification code sent to email" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------------------
// Verify Email
// --------------------
exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "User already verified" });

    if (user.verificationCode !== code || user.codeExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.codeExpires = null;
    await user.save();

    await sendWelcomeEmail(user.email, user.fullName);

    res.json({ message: "Email verified successfully, welcome email sent" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --------------------
// Login
// --------------------
exports.login = async (req, res) => {
  try {
    const { emailOrPhone, password, mode } = req.body;

    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email first" });
    }

    let expiresIn = "24h"; // default
    if (mode === "passwordFree") expiresIn = "30d";
    else if (mode === "strict") expiresIn = "1h";

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn });

    res.json({
      message: "Login successful",
      token,
      mode: mode || "24h",
      user: {
        id: user._id,
        fullName: user.fullName,
        amstapayAccountNumber: user.amstapayAccountNumber,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --------------------
// Forgot Password
// --------------------
exports.forgotPassword = async (req, res) => {
  try {
    const { emailOrPhone } = req.body;

    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000);

    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    if (user.email) {
      await sendVerificationCodeEmail(user.email, user.fullName, resetCode);
    }

    res.json({ message: "Password reset code sent successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --------------------
// Verify Reset Code
// --------------------
exports.verifyResetCode = async (req, res) => {
  try {
    const { emailOrPhone, code } = req.body;

    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.resetPasswordCode || user.resetPasswordCode !== code || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    res.json({ message: "Code verified. You can now reset your password." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --------------------
// Reset Password
// --------------------
exports.resetPassword = async (req, res) => {
  try {
    const { emailOrPhone, code, newPassword } = req.body;

    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.resetPasswordCode || user.resetPasswordCode !== code || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    user.password = newPassword;
    user.resetPasswordCode = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --------------------
// Forgot PIN
// --------------------
exports.forgotPin = async (req, res) => {
  try {
    const { emailOrPhone } = req.body;

    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000);

    user.resetPinCode = resetCode;
    user.resetPinExpires = resetExpires;
    await user.save();

    if (user.email) {
      await sendResetPinEmail(user.email, user.fullName, resetCode);
    }

    res.json({ message: "PIN reset code sent successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --------------------
// Verify PIN Reset Code
// --------------------
exports.verifyPinResetCode = async (req, res) => {
  try {
    const { emailOrPhone, code } = req.body;

    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.resetPinCode || user.resetPinCode !== code || user.resetPinExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    res.json({ message: "Code verified. You can now reset your PIN." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --------------------
// Reset PIN
// --------------------
exports.resetPin = async (req, res) => {
  try {
    const { emailOrPhone, code, newPin } = req.body;

    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.resetPinCode || user.resetPinCode !== code || user.resetPinExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    user.pin = newPin; // make sure User schema hashes this!
    user.resetPinCode = null;
    user.resetPinExpires = null;
    await user.save();

    if (user.email) {
      await sendPinResetSuccessEmail(user.email, user.fullName);
    }

    res.json({ message: "Transaction PIN reset successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
