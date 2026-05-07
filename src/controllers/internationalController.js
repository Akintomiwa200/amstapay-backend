const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const { sendEmail, sendVerificationCodeEmail } = require("../services/emailService");
const { sendOTP, sendTransactionAlert } = require("../services/customNotificationService");
const crypto = require("crypto");

/**
 * @swagger
 * tags:
 *   name: International
 *   description: International money transfer
 */

/**
 * Create international transfer
 */
exports.initiateInternationalTransfer = async (req, res) => {
  try {
    const {
      amount,
      receiverCountry,
      receiverCurrency,
      receiverAccountName,
      receiverAccountNumber,
      receiverBank,
      receiverSwiftCode,
      receiverEmail,
      receiverPhone,
      description
    } = req.body;

    const sender = await User.findById(req.user._id);
    if (!sender) return res.status(404).json({ error: "Sender not found" });

    const senderWallet = await Wallet.findOne({ user: sender._id });
    if (!senderWallet || senderWallet.balance < amount) {
      return res.status(400).json({ error: "Insufficient funds" });
    }

    const reference = `INT-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const exchangeRate = 1;
    const originalAmount = amount;

    const transaction = new Transaction({
      sender: sender._id,
      amount,
      originalAmount,
      originalCurrency: "NGN",
      type: "international_transfer",
      receiverName: receiverAccountName,
      receiverAccountNumber: receiverAccountNumber,
      receiverBank,
      receiverCountry,
      receiverCurrency,
      receiverEmail,
      receiverPhone,
      receiverSwiftCode,
      reference,
      internationalReference: reference,
      exchangeRate,
      status: "pending",
      description
    });

    await transaction.save();

    senderWallet.balance -= amount;
    await senderWallet.save();

    // Send email notification
    if (sender.email) {
      await sendEmail(
        sender.email,
        "International Transfer Initiated",
        `You initiated an international transfer of ₦${amount} to ${receiverAccountName} in ${receiverCountry}. Reference: ${reference}`
      );
    }

    // Send SMS to receiver using custom notification service
    if (receiverPhone) {
      await sendTransactionAlert({
        userId: null,
        email: receiverEmail,
        phone: receiverPhone,
        transaction: {
          amount: amount * exchangeRate,
          currency: receiverCurrency,
          status: "pending",
          type: "international_transfer",
          reference
        }
      });
    }

    res.status(201).json({
      message: "International transfer initiated",
      transaction
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get international transfer rates
 */
exports.getExchangeRates = async (req, res) => {
  try {
    const axios = require("axios");
    let apiRates = {};

    try {
      const resp = await axios.get("https://api.exchangerate-api.com/v4/latest/NGN", { timeout: 5000 });
      if (resp.data?.rates) {
        const wanted = ["USD", "EUR", "GBP", "GHS", "KES", "ZAR"];
        for (const code of wanted) {
          apiRates[code] = {
            rate: resp.data.rates[code] || 0,
            name: { USD: "US Dollar", EUR: "Euro", GBP: "British Pound", GHS: "Ghanaian Cedi", KES: "Kenyan Shilling", ZAR: "South African Rand" }[code],
          };
        }
      }
    } catch (apiErr) {
      console.error("Exchange rate API error:", apiErr.message);
    }

    const rates = Object.keys(apiRates).length > 0 ? apiRates : {
      USD: { rate: 0.00067, name: "US Dollar" },
      EUR: { rate: 0.00061, name: "Euro" },
      GBP: { rate: 0.00052, name: "British Pound" },
      GHS: { rate: 0.0063, name: "Ghanaian Cedi" },
      KES: { rate: 0.081, name: "Kenyan Shilling" },
      ZAR: { rate: 0.11, name: "South African Rand" },
    };

    res.json({ rates, base: "NGN", live: Object.keys(apiRates).length > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get supported countries for international transfer
 */
exports.getSupportedCountries = async (req, res) => {
  try {
    const countries = [
      { code: "US", name: "United States", currency: "USD", swiftRequired: true },
      { code: "GB", name: "United Kingdom", currency: "GBP", swiftRequired: true },
      { code: "EU", name: "Europe", currency: "EUR", swiftRequired: true },
      { code: "GH", name: "Ghana", currency: "GHS", swiftRequired: false },
      { code: "KE", name: "Kenya", currency: "KES", swiftRequired: false },
      { code: "ZA", name: "South Africa", currency: "ZAR", swiftRequired: false },
      { code: "NG", name: "Nigeria", currency: "NGN", swiftRequired: false }
    ];

    res.json(countries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Send OTP for international transfer verification
 */
exports.sendInternationalTransferOTP = async (req, res) => {
  try {
    const { emailOrPhone } = req.body;

    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }]
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otpCode = otpCode;
    user.otpExpires = otpExpires;
    user.isOtpVerified = false;
    await user.save();

    // Send via custom notification service (email, SMS, WhatsApp)
    await sendOTP({
      userId: user._id,
      email: user.email,
      phone: user.phoneNumber,
      fullName: user.fullName,
      code: otpCode
    });

    res.json({ message: "OTP sent successfully via email, SMS, and WhatsApp" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Verify OTP for international transfer
 */
exports.verifyInternationalTransferOTP = async (req, res) => {
  try {
    const { emailOrPhone, code } = req.body;

    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }]
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.otpCode || user.otpCode !== code || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isOtpVerified = true;
    user.otpCode = null;
    user.otpExpires = null;
    await user.save();

    const token = require("jsonwebtoken").sign(
      { id: user._id, otpVerified: true },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ message: "OTP verified successfully", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  initiateInternationalTransfer: exports.initiateInternationalTransfer,
  getExchangeRates: exports.getExchangeRates,
  getSupportedCountries: exports.getSupportedCountries,
  sendInternationalTransferOTP: exports.sendInternationalTransferOTP,
  verifyInternationalTransferOTP: exports.verifyInternationalTransferOTP
};