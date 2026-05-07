const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const Bill = require("../models/Bill");
const Loan = require("../models/Loan");
const Investment = require("../models/Investment");
const SupportTicket = require("../models/SupportTicket");
const Escrow = require("../models/Escrow");

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers, verifiedUsers, totalWallets, totalTransactions,
      totalVolume, pendingLoans, activeInvestments, openTickets, activeEscrows,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isVerified: true }),
      Wallet.countDocuments(),
      Transaction.countDocuments(),
      Transaction.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
      Loan.countDocuments({ status: "PENDING" }),
      Investment.countDocuments({ status: "active" }),
      SupportTicket.countDocuments({ status: { $in: ["open", "in_progress"] } }),
      Escrow.countDocuments({ status: { $in: ["funded", "disputed"] } }),
    ]);

    res.json({
      success: true, data: {
        totalUsers, verifiedUsers, unverifiedUsers: totalUsers - verifiedUsers,
        totalWallets, totalTransactions,
        totalVolume: totalVolume[0]?.total || 0,
        pendingLoans, activeInvestments, openTickets, activeEscrows,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, isVerified } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (isVerified !== undefined) filter.isVerified = isVerified === "true";
    if (search) filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phoneNumber: { $regex: search, $options: "i" } },
    ];
    const users = await User.find(filter).select("-password -pin -web3Wallet").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    const total = await User.countDocuments(filter);
    res.json({ success: true, data: users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -pin");
    if (!user) return res.status(404).json({ message: "User not found" });
    const [wallet, transactions, tickets] = await Promise.all([
      Wallet.findOne({ user: user._id }),
      Transaction.find({ $or: [{ sender: user._id }, { receiver: user._id }] }).sort({ createdAt: -1 }).limit(20),
      SupportTicket.find({ user: user._id }).sort({ updatedAt: -1 }),
    ]);
    res.json({ success: true, data: { user, wallet, transactions, tickets } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type, from, to } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    const transactions = await Transaction.find(filter).populate("sender receiver", "fullName email").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    const total = await Transaction.countDocuments(filter);
    const volume = await Transaction.aggregate([{ $match: filter }, { $group: { _id: null, total: { $sum: "$amount" } } }]);
    res.json({ success: true, data: transactions, total, page: parseInt(page), pages: Math.ceil(total / limit), volume: volume[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTickets = async (req, res) => {
  try {
    const { status, priority } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    const tickets = await SupportTicket.find(filter).populate("user", "fullName email phoneNumber").sort({ priority: -1, createdAt: -1 });
    res.json({ success: true, count: tickets.length, data: tickets });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSystemHealth = async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const dbState = mongoose.connection.readyState;
    res.json({
      success: true, data: {
        status: "ok", uptime: process.uptime(),
        database: dbState === 1 ? "connected" : "disconnected",
        memory: process.memoryUsage(),
        pid: process.pid, node: process.version,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Loan Admin Management ─────────────────────────────────────────────

exports.approveLoan = async (req, res) => {
  try {
    const Loan = require("../models/Loan");
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: "Loan not found" });
    if (loan.status !== "PENDING") return res.status(400).json({ message: `Loan is ${loan.status}, not PENDING` });

    loan.status = "APPROVED";
    loan.statusHistory.push({ status: "APPROVED", note: req.body.note || "Approved by admin", changedBy: req.user._id });
    await loan.save();

    res.json({ success: true, message: "Loan approved", data: loan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.rejectLoan = async (req, res) => {
  try {
    const Loan = require("../models/Loan");
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: "Loan not found" });
    if (loan.status !== "PENDING") return res.status(400).json({ message: `Loan is ${loan.status}, not PENDING` });

    loan.status = "REJECTED";
    loan.rejectionReason = req.body.reason || "Rejected by admin";
    loan.statusHistory.push({ status: "REJECTED", note: loan.rejectionReason, changedBy: req.user._id });
    await loan.save();

    res.json({ success: true, message: "Loan rejected", data: loan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.disburseLoan = async (req, res) => {
  try {
    const Loan = require("../models/Loan");
    const Wallet = require("../models/Wallet");
    const Transaction = require("../models/Transaction");

    const loan = await Loan.findById(req.params.id).populate("user");
    if (!loan) return res.status(404).json({ message: "Loan not found" });
    if (loan.status !== "APPROVED") return res.status(400).json({ message: `Loan is ${loan.status}, must be APPROVED` });

    const wallet = await Wallet.findOne({ user: loan.user._id });
    if (!wallet) return res.status(400).json({ message: "User has no wallet" });

    const disbursedAmount = Math.round(loan.amount * 0.97 * 100) / 100;

    wallet.balance += disbursedAmount;
    wallet.ledger.push({ type: "credit", amount: disbursedAmount, description: `Loan disbursement - ${loan.reference}` });
    await wallet.save();

    const schedule = [];
    const monthlyPayment = loan.monthlyInstallment;
    for (let i = 1; i <= loan.termMonths; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);
      schedule.push({
        dueDate,
        amountDue: monthlyPayment,
        amountPaid: 0,
        status: "pending",
        payments: [],
      });
    }

    loan.status = "DISBURSED";
    loan.disbursement = { amount: disbursedAmount, date: new Date(), method: "wallet", reference: `DIB-${Date.now()}` };
    loan.repaymentSchedule = schedule;
    loan.nextPaymentDate = schedule[0]?.dueDate;
    loan.nextPaymentAmount = monthlyPayment;
    loan.outstandingBalance = loan.totalRepayable;
    loan.statusHistory.push({ status: "DISBURSED", note: "Loan disbursed to wallet", changedBy: req.user._id });
    await loan.save();

    await Transaction.create({
      sender: loan.user._id,
      amount: disbursedAmount,
      type: "fund",
      status: "success",
      reference: `LN-DIB-${Date.now()}`,
      description: `Loan disbursement - ${loan.reference}`,
    });

    res.json({ success: true, message: "Loan disbursed", amount: disbursedAmount, data: loan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllLoans = async (req, res) => {
  try {
    const Loan = require("../models/Loan");
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status.toUpperCase();
    const loans = await Loan.find(filter).populate("user", "fullName email phoneNumber").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    const total = await Loan.countDocuments(filter);
    res.json({ success: true, data: loans, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
