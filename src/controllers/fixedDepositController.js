const FixedDeposit = require("../models/FixedDeposit");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

const INTEREST_RATES = { 30: 5.5, 60: 7.0, 90: 8.5, 180: 11.0, 365: 14.5 };

exports.createDeposit = async (req, res) => {
  try {
    const { amount, tenureDays, autoRollover } = req.body;
    if (!amount || !tenureDays) return res.status(400).json({ message: "amount and tenureDays required" });
    if (amount < 10000) return res.status(400).json({ message: "Minimum deposit is ₦10,000" });
    if (![30, 60, 90, 180, 365].includes(tenureDays)) return res.status(400).json({ message: "tenureDays must be 30, 60, 90, 180, or 365" });

    const interestRate = INTEREST_RATES[tenureDays];
    const interestEarned = Math.round(amount * (interestRate / 100) * (tenureDays / 365) * 100) / 100;
    const totalPayout = amount + interestEarned;

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < amount) return res.status(400).json({ message: "Insufficient balance" });

    wallet.balance -= amount;
    wallet.ledger.push({ type: "debit", amount, description: `Fixed deposit: ${tenureDays} days @ ${interestRate}%` });
    await wallet.save();

    const maturityDate = new Date(Date.now() + tenureDays * 86400000);
    const deposit = await FixedDeposit.create({
      user: req.user._id, amount, tenureDays, interestRate,
      interestEarned, totalPayout, maturityDate, autoRollover: autoRollover || false,
    });

    await Transaction.create({
      sender: req.user._id, amount, type: "fund", status: "success",
      reference: `FD-${Date.now()}`, description: `Fixed deposit: ${tenureDays}d @ ${interestRate}%`,
    });

    res.status(201).json({ message: "Fixed deposit created", data: deposit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listDeposits = async (req, res) => {
  try {
    const deposits = await FixedDeposit.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: deposits.length, data: deposits });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.claimDeposit = async (req, res) => {
  try {
    const deposit = await FixedDeposit.findOne({ _id: req.params.id, user: req.user._id });
    if (!deposit) return res.status(404).json({ message: "Deposit not found" });
    if (deposit.status !== "active") return res.status(400).json({ message: `Deposit is already ${deposit.status}` });

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (wallet) {
      wallet.balance += deposit.totalPayout;
      wallet.ledger.push({ type: "credit", amount: deposit.totalPayout, description: `Fixed deposit matured: ₦${deposit.amount} + ₦${deposit.interestEarned} interest` });
      await wallet.save();
    }

    deposit.status = "matured";
    deposit.closedAt = new Date();
    await deposit.save();

    await Transaction.create({
      receiver: req.user._id, amount: deposit.totalPayout,
      type: "fund", status: "success", reference: `FD-MAT-${Date.now()}`,
      description: `Fixed deposit matured: ₦${deposit.amount} + ₦${deposit.interestEarned} interest`,
    });

    res.json({ message: "Deposit claimed", amount: deposit.totalPayout, interestEarned: deposit.interestEarned });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.autoMatureDeposits = async () => {
  try {
    const due = await FixedDeposit.find({ status: "active", maturityDate: { $lte: new Date() } });
    for (const deposit of due) {
      try {
        if (deposit.autoRollover) {
          const newDeposit = await FixedDeposit.create({
            user: deposit.user, amount: deposit.totalPayout,
            tenureDays: deposit.tenureDays, interestRate: deposit.interestRate,
            interestEarned: 0, totalPayout: 0, autoRollover: deposit.autoRollover,
            startDate: new Date(), maturityDate: new Date(Date.now() + deposit.tenureDays * 86400000),
          });
          deposit.status = "rolled_over";
          deposit.rolledOverTo = newDeposit._id;
          await deposit.save();
        } else {
          const wallet = await Wallet.findOne({ user: deposit.user });
          if (wallet) {
            wallet.balance += deposit.totalPayout;
            wallet.ledger.push({ type: "credit", amount: deposit.totalPayout, description: `Fixed deposit auto-matured: ₦${deposit.amount}` });
            await wallet.save();
          }
          deposit.status = "matured";
          deposit.closedAt = new Date();
          await deposit.save();
        }
      } catch (err) {
        console.error(`Auto-mature deposit ${deposit._id} error:`, err.message);
      }
    }
  } catch (err) {
    console.error("Auto-mature error:", err.message);
  }
};
