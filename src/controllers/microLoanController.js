const MicroLoan = require("../models/MicroLoan");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

const MICRO_LOAN_RATES = { 7: 1.5, 14: 2.5, 30: 5.0 };
const MAX_ACTIVE_LOANS = 2;
const MIN_BALANCE_FOR_ELIGIBILITY = 50000;

exports.applyMicroLoan = async (req, res) => {
  try {
    const { amount, tenureDays } = req.body;
    if (!amount || !tenureDays) return res.status(400).json({ message: "amount and tenureDays required" });
    if (amount < 1000 || amount > 50000) return res.status(400).json({ message: "Micro-loan amount: ₦1,000 - ₦50,000" });
    if (![7, 14, 30].includes(tenureDays)) return res.status(400).json({ message: "tenureDays must be 7, 14, or 30" });

    const activeCount = await MicroLoan.countDocuments({ user: req.user._id, status: "active" });
    if (activeCount >= MAX_ACTIVE_LOANS) return res.status(400).json({ message: `Maximum ${MAX_ACTIVE_LOANS} active micro-loans allowed` });

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < MIN_BALANCE_FOR_ELIGIBILITY) {
      return res.status(400).json({ message: `Minimum wallet balance of ₦${MIN_BALANCE_FOR_ELIGIBILITY} required for micro-loan eligibility` });
    }

    const interestRate = MICRO_LOAN_RATES[tenureDays];
    const fee = Math.round(amount * (interestRate / 100) * 100) / 100;
    const totalRepayable = amount + fee;
    const dueDate = new Date(Date.now() + tenureDays * 86400000);

    wallet.balance += amount;
    wallet.ledger.push({ type: "credit", amount, description: `Micro-loan disbursement (${tenureDays}d @ ${interestRate}%)` });
    await wallet.save();

    const loan = await MicroLoan.create({
      user: req.user._id, amount, fee, totalRepayable, tenureDays,
      interestRate, dueDate,
    });

    const tx = await Transaction.create({
      sender: req.user._id, amount, type: "fund", status: "success",
      reference: `ML-${Date.now()}`, description: `Micro-loan: ₦${amount} (${tenureDays}d @ ${interestRate}%)`,
    });

    loan.transaction = tx._id;
    await loan.save();

    res.status(201).json({ message: "Micro-loan disbursed", data: loan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.repayMicroLoan = async (req, res) => {
  try {
    const loan = await MicroLoan.findOne({ _id: req.params.id, user: req.user._id });
    if (!loan) return res.status(404).json({ message: "Micro-loan not found" });
    if (loan.status !== "active") return res.status(400).json({ message: `Loan is already ${loan.status}` });

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < loan.totalRepayable) return res.status(400).json({ message: "Insufficient balance for repayment" });

    wallet.balance -= loan.totalRepayable;
    wallet.ledger.push({ type: "debit", amount: loan.totalRepayable, description: `Micro-loan repayment: ₦${loan.amount}` });
    await wallet.save();

    loan.status = "repaid";
    loan.repaidAt = new Date();
    await loan.save();

    await Transaction.create({
      sender: req.user._id, amount: loan.totalRepayable, type: "normal_transfer",
      status: "success", reference: `ML-REPAY-${Date.now()}`,
      description: `Micro-loan repayment: ₦${loan.amount} + ₦${loan.fee} fee`,
    });

    res.json({ message: "Micro-loan repaid", amount: loan.amount, fee: loan.fee, total: loan.totalRepayable });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listLoans = async (req, res) => {
  try {
    const loans = await MicroLoan.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: loans.length, data: loans });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.processOverdueLoans = async () => {
  try {
    const overdue = await MicroLoan.find({ status: "active", dueDate: { $lte: new Date() } });
    for (const loan of overdue) {
      const daysOverdue = Math.ceil((Date.now() - loan.dueDate) / 86400000);
      loan.overdueDays = daysOverdue;
      loan.lateFee = Math.round(loan.amount * 0.01 * daysOverdue * 100) / 100;
      if (daysOverdue >= 30) loan.status = "defaulted";
      await loan.save();
    }
  } catch (err) {
    console.error("Overdue processing error:", err.message);
  }
};
