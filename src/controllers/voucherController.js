const Voucher = require("../models/Voucher");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const crypto = require("crypto");

exports.createVoucher = async (req, res) => {
  try {
    const { amount, recipientEmail, recipientPhone, message, expiresInDays } = req.body;
    if (!amount || amount < 100) return res.status(400).json({ message: "Minimum voucher amount is ₦100" });
    if (!recipientEmail && !recipientPhone) return res.status(400).json({ message: "recipientEmail or recipientPhone required" });

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < amount) return res.status(400).json({ message: "Insufficient balance" });

    wallet.balance -= amount;
    wallet.ledger.push({ type: "debit", amount, description: `Voucher purchase` });
    await wallet.save();

    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    const voucher = await Voucher.create({
      code, type: "gift", amount, issuer: req.user._id,
      recipientEmail, recipientPhone, message,
      expiresAt: new Date(Date.now() + (expiresInDays || 365) * 86400000),
    });

    await Transaction.create({
      sender: req.user._id, amount, type: "fund", status: "success",
      reference: `VOUCHER-${code}`, description: `Voucher purchase: ${code}`,
    });

    res.status(201).json({ message: "Voucher created", data: { code, amount, expiresAt: voucher.expiresAt } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.redeemVoucher = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Voucher code required" });

    const voucher = await Voucher.findOne({ code: code.toUpperCase(), status: "active" });
    if (!voucher) return res.status(404).json({ message: "Invalid or expired voucher" });
    if (voucher.expiresAt && voucher.expiresAt < new Date()) {
      voucher.status = "expired";
      await voucher.save();
      return res.status(410).json({ message: "Voucher has expired" });
    }

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (wallet) {
      wallet.balance += voucher.amount;
      wallet.ledger.push({ type: "credit", amount: voucher.amount, description: `Voucher redeemed: ${voucher.code}` });
      await wallet.save();
    }

    voucher.status = "redeemed";
    voucher.redeemedBy = req.user._id;
    voucher.redeemedAt = new Date();
    await voucher.save();

    await Transaction.create({
      receiver: req.user._id, amount: voucher.amount, type: "fund", status: "success",
      reference: `REDEEM-${voucher.code}`, description: `Voucher redeemed: ${voucher.code}`,
    });

    res.json({ message: "Voucher redeemed", amount: voucher.amount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find({
      $or: [{ issuer: req.user._id }, { redeemedBy: req.user._id }],
    }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: vouchers.length, data: vouchers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
