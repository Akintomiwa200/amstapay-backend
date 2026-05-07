const Escrow = require("../models/Escrow");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

exports.createEscrow = async (req, res) => {
  try {
    const { sellerEmail, amount, title, description, daysToComplete, terms } = req.body;
    if (!sellerEmail || !amount || !title) return res.status(400).json({ message: "sellerEmail, amount, and title required" });

    const seller = await User.findOne({ email: sellerEmail });
    if (!seller) return res.status(404).json({ message: "Seller not found" });
    if (seller._id.toString() === req.user._id.toString()) return res.status(400).json({ message: "Cannot create escrow with yourself" });

    const fee = Math.round(amount * 0.02);
    const totalAmount = amount + fee;
    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < totalAmount) return res.status(400).json({ message: "Insufficient balance" });

    wallet.balance -= totalAmount;
    await wallet.save();

    const escrow = await Escrow.create({
      buyer: req.user._id, seller: seller._id, amount, fee, totalAmount,
      title, description, reference: `ESC-${Date.now()}`,
      daysToComplete: daysToComplete || 7, terms,
      deadline: new Date(Date.now() + (daysToComplete || 7) * 86400000),
      status: "funded", fundedAt: new Date(),
      timeline: [{ status: "funded", note: "Buyer funded the escrow", updatedBy: req.user._id }],
      transactions: [{ type: "fund", amount: totalAmount }],
    });

    res.status(201).json({ success: true, data: escrow });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listEscrows = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { $or: [{ buyer: req.user._id }, { seller: req.user._id }] };
    if (status) filter.status = status;
    const escrows = await Escrow.find(filter).populate("buyer seller", "fullName email").sort({ createdAt: -1 });
    res.json({ success: true, count: escrows.length, data: escrows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getEscrow = async (req, res) => {
  try {
    const escrow = await Escrow.findOne({
      _id: req.params.id, $or: [{ buyer: req.user._id }, { seller: req.user._id }],
    }).populate("buyer seller", "fullName email");
    if (!escrow) return res.status(404).json({ message: "Escrow not found" });
    res.json({ success: true, data: escrow });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.releaseEscrow = async (req, res) => {
  try {
    const escrow = await Escrow.findOne({ _id: req.params.id, buyer: req.user._id, status: { $in: ["funded", "in_progress"] } });
    if (!escrow) return res.status(404).json({ message: "Escrow not found or not releasable" });
    const sellerWallet = await Wallet.findOne({ user: escrow.seller });
    sellerWallet.balance += escrow.amount;
    await sellerWallet.save();
    const txn = await Transaction.create({
      sender: escrow.buyer, receiver: escrow.seller, type: "normal_transfer",
      amount: escrow.amount, description: `Escrow release: ${escrow.title}`,
      status: "success", reference: `ESC-REL-${Date.now()}`,
    });
    escrow.status = "completed";
    escrow.completedAt = new Date();
    escrow.timeline.push({ status: "completed", note: "Buyer released funds to seller", updatedBy: req.user._id });
    escrow.transactions.push({ type: "release", amount: escrow.amount, transactionId: txn._id });
    await escrow.save();
    res.json({ success: true, data: escrow });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.disputeEscrow = async (req, res) => {
  try {
    const { reason } = req.body;
    const escrow = await Escrow.findOne({
      _id: req.params.id, $or: [{ buyer: req.user._id }, { seller: req.user._id }],
      status: { $in: ["funded", "in_progress"] },
    });
    if (!escrow) return res.status(404).json({ message: "Escrow not found or cannot be disputed" });
    escrow.status = "disputed";
    escrow.disputeReason = reason || "No reason provided";
    escrow.disputeOpenedAt = new Date();
    escrow.timeline.push({ status: "disputed", note: reason || "Dispute opened", updatedBy: req.user._id });
    await escrow.save();
    res.json({ success: true, message: "Dispute opened. Admin will review.", data: escrow });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.refundEscrow = async (req, res) => {
  try {
    const escrow = await Escrow.findOne({ _id: req.params.id, status: "disputed" });
    if (!escrow) return res.status(404).json({ message: "Disputed escrow not found" });
    const buyerWallet = await Wallet.findOne({ user: escrow.buyer });
    buyerWallet.balance += escrow.totalAmount;
    await buyerWallet.save();
    escrow.status = "refunded";
    escrow.disputeResolvedAt = new Date();
    escrow.resolvedBy = req.user._id;
    escrow.timeline.push({ status: "refunded", note: "Admin refunded buyer", updatedBy: req.user._id });
    escrow.transactions.push({ type: "refund", amount: escrow.totalAmount });
    await escrow.save();
    res.json({ success: true, message: "Escrow refunded to buyer" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
