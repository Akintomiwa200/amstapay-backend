const JointAccount = require("../models/JointAccount");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

exports.createJoint = async (req, res) => {
  try {
    const { name, partnerAccountNumber, goalAmount, goalDescription } = req.body;
    if (!name || !partnerAccountNumber) return res.status(400).json({ message: "name and partnerAccountNumber required" });

    const partner = await User.findOne({ amstapayAccountNumber: partnerAccountNumber });
    if (!partner) return res.status(404).json({ message: "Partner not found" });
    if (partner._id.toString() === req.user._id.toString()) return res.status(400).json({ message: "Cannot create joint account with yourself" });

    const account = await JointAccount.create({
      name, owners: [
        { user: req.user._id, role: "admin" },
        { user: partner._id, role: "member" },
      ], goalAmount, goalDescription,
    });

    res.status(201).json({ message: "Joint account created", data: account });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listJoint = async (req, res) => {
  try {
    const accounts = await JointAccount.find({ "owners.user": req.user._id, status: "active" })
      .populate("owners.user", "fullName email").lean();
    res.json({ success: true, count: accounts.length, data: accounts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.fundJoint = async (req, res) => {
  try {
    const account = await JointAccount.findById(req.params.id);
    if (!account) return res.status(404).json({ message: "Account not found" });
    const isOwner = account.owners.some(o => o.user.toString() === req.user._id.toString());
    if (!isOwner) return res.status(403).json({ message: "Not an owner" });

    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: "Valid amount required" });

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < amount) return res.status(400).json({ message: "Insufficient balance" });

    wallet.balance -= amount;
    wallet.ledger.push({ type: "debit", amount, description: `Joint account: ${account.name}` });
    await wallet.save();

    account.balance += amount;
    const owner = account.owners.find(o => o.user.toString() === req.user._id.toString());
    if (owner) owner.contribution = (owner.contribution || 0) + amount;
    account.transactionHistory.push({ type: "credit", amount, description: "Deposit", byUser: req.user._id });
    await account.save();

    res.json({ message: "Joint account funded", balance: account.balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.withdrawJoint = async (req, res) => {
  try {
    const account = await JointAccount.findById(req.params.id);
    if (!account) return res.status(404).json({ message: "Account not found" });
    const isOwner = account.owners.some(o => o.user.toString() === req.user._id.toString());
    if (!isOwner) return res.status(403).json({ message: "Not an owner" });

    if (account.requireBothApprovals && account.owners.length > 1) {
      return res.status(400).json({ message: "This account requires both owner approvals for withdrawals" });
    }

    const { amount, description } = req.body;
    if (!amount || account.balance < amount) return res.status(400).json({ message: "Insufficient joint balance" });

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (wallet) {
      wallet.balance += amount;
      wallet.ledger.push({ type: "credit", amount, description: `Joint withdrawal: ${account.name}` });
      await wallet.save();
    }

    account.balance -= amount;
    account.transactionHistory.push({ type: "debit", amount, description: description || "Withdrawal", byUser: req.user._id });
    await account.save();

    res.json({ message: "Withdrawal successful", balance: account.balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
