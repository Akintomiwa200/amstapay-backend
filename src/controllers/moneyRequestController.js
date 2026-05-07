const MoneyRequest = require("../models/MoneyRequest");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

exports.requestMoney = async (req, res) => {
  try {
    const { recipientAccountNumber, amount, description } = req.body;
    if (!recipientAccountNumber || !amount) return res.status(400).json({ message: "recipientAccountNumber and amount required" });
    if (amount < 50) return res.status(400).json({ message: "Minimum request is ₦50" });

    const recipient = await User.findOne({ amstapayAccountNumber: recipientAccountNumber });
    if (!recipient) return res.status(404).json({ message: "Recipient not found" });
    if (recipient._id.toString() === req.user._id.toString()) return res.status(400).json({ message: "Cannot request from yourself" });

    const existing = await MoneyRequest.findOne({ requester: req.user._id, recipient: recipient._id, status: "pending" });
    if (existing) return res.status(400).json({ message: "You already have a pending request to this user" });

    const request = await MoneyRequest.create({
      requester: req.user._id, recipient: recipient._id, amount, description,
      expiresAt: new Date(Date.now() + 7 * 86400000),
    });

    res.status(201).json({ message: "Money request sent", data: request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listIncoming = async (req, res) => {
  try {
    const requests = await MoneyRequest.find({ recipient: req.user._id }).populate("requester", "fullName email amstapayAccountNumber").sort({ createdAt: -1 });
    res.json({ success: true, count: requests.length, data: requests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listOutgoing = async (req, res) => {
  try {
    const requests = await MoneyRequest.find({ requester: req.user._id }).populate("recipient", "fullName email amstapayAccountNumber").sort({ createdAt: -1 });
    res.json({ success: true, count: requests.length, data: requests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.payRequest = async (req, res) => {
  try {
    const request = await MoneyRequest.findById(req.params.id).populate("requester");
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.recipient.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Not your request to pay" });
    if (request.status !== "pending") return res.status(400).json({ message: `Request is already ${request.status}` });

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < request.amount) return res.status(400).json({ message: "Insufficient balance" });

    wallet.balance -= request.amount;
    wallet.ledger.push({ type: "debit", amount: request.amount, description: `Paid money request to ${request.requester.fullName}` });
    await wallet.save();

    const requesterWallet = await Wallet.findOne({ user: request.requester._id });
    if (requesterWallet) {
      requesterWallet.balance += request.amount;
      requesterWallet.ledger.push({ type: "credit", amount: request.amount, description: `Money request from ${req.user.fullName} paid` });
      await requesterWallet.save();
    }

    const tx = await Transaction.create({
      sender: req.user._id, receiver: request.requester._id, amount: request.amount,
      type: "normal_transfer", status: "success", reference: `MR-${Date.now()}`,
      description: `Money request payment: ${request.description || "No description"}`,
    });

    request.status = "paid";
    request.transaction = tx._id;
    request.respondedAt = new Date();
    await request.save();

    res.json({ message: "Request paid", transaction: tx });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.declineRequest = async (req, res) => {
  try {
    const request = await MoneyRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.recipient.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Not authorized" });
    if (request.status !== "pending") return res.status(400).json({ message: `Request is already ${request.status}` });

    request.status = "declined";
    request.respondedAt = new Date();
    await request.save();

    res.json({ message: "Request declined" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelRequest = async (req, res) => {
  try {
    const request = await MoneyRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.requester.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Not authorized" });
    if (request.status !== "pending") return res.status(400).json({ message: `Request is already ${request.status}` });

    request.status = "cancelled";
    await request.save();
    res.json({ message: "Request cancelled" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
