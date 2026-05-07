const BillSplit = require("../models/BillSplit");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

exports.createSplit = async (req, res) => {
  try {
    const { title, totalAmount, splits, category, note } = req.body;
    if (!title || !totalAmount || !splits || !Array.isArray(splits) || splits.length === 0) {
      return res.status(400).json({ message: "title, totalAmount, and splits array required" });
    }

    const participants = [];
    for (const s of splits) {
      const user = await User.findOne({ amstapayAccountNumber: s.accountNumber });
      if (!user) return res.status(404).json({ message: `User not found: ${s.accountNumber}` });
      participants.push({ user: user._id, amount: s.amount || totalAmount / splits.length });
    }

    const split = await BillSplit.create({ creator: req.user._id, title, totalAmount, participants, category, note });
    res.status(201).json({ message: "Bill split created", data: split });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listSplits = async (req, res) => {
  try {
    const splits = await BillSplit.find({
      $or: [{ creator: req.user._id }, { "participants.user": req.user._id }],
    }).populate("creator participants.user", "fullName email amstapayAccountNumber")
      .sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: splits.length, data: splits });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.paySplit = async (req, res) => {
  try {
    const split = await BillSplit.findById(req.params.id).populate("creator", "fullName");
    if (!split) return res.status(404).json({ message: "Split not found" });
    if (split.status !== "open") return res.status(400).json({ message: "Split already settled" });

    const participant = split.participants.find(p => p.user.toString() === req.user._id.toString());
    if (!participant) return res.status(403).json({ message: "Not a participant" });
    if (participant.status === "paid") return res.status(400).json({ message: "Already paid" });

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < participant.amount) return res.status(400).json({ message: "Insufficient balance" });

    wallet.balance -= participant.amount;
    wallet.ledger.push({ type: "debit", amount: participant.amount, description: `Bill split: ${split.title}` });
    await wallet.save();

    const creatorWallet = await Wallet.findOne({ user: split.creator._id });
    if (creatorWallet) {
      creatorWallet.balance += participant.amount;
      creatorWallet.ledger.push({ type: "credit", amount: participant.amount, description: `Split payment from ${req.user.fullName} for ${split.title}` });
      await creatorWallet.save();
    }

    const tx = await Transaction.create({
      sender: req.user._id, receiver: split.creator._id, amount: participant.amount,
      type: "normal_transfer", status: "success", reference: `BS-${Date.now()}`,
      description: `Bill split: ${split.title}`,
    });

    participant.status = "paid";
    participant.paidAt = new Date();
    participant.transaction = tx._id;

    const allPaid = split.participants.every(p => p.status === "paid");
    if (allPaid) { split.status = "settled"; split.settledAt = new Date(); }
    await split.save();

    res.json({ message: "Split paid", remaining: split.participants.filter(p => p.status !== "paid").length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
