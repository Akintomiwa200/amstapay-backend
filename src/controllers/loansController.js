const Loan = require('../models/Loan');
const Wallet = require('../models/Wallet');

// Apply for loan
exports.applyLoan = async (req, res) => {
  try {
    const { amount, termMonths, collateral } = req.body;
    const userId = req.user._id;

    const loan = await Loan.create({
      user: userId,
      amount,
      termMonths,
      collateral,
      reference: 'LOAN-' + Date.now()
    });

    res.status(201).json({ message: 'Loan application submitted', loan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// List user's loans
exports.listLoans = async (req, res) => {
  try {
    const userId = req.user._id;
    const loans = await Loan.find({ user: userId }).sort({ createdAt: -1 });
    res.json(loans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Loan details
exports.getLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('user', 'fullName');
    if (loan.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(loan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Repay loan
exports.repayLoan = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user._id;

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });

    wallet.balance -= amount;
    await wallet.save();

    // Update loan totalRepaid
    const loan = await Loan.findById(req.params.id);
    loan.totalRepaid += amount;
    if (loan.totalRepaid >= loan.amount) loan.status = 'repaid';
    await loan.save();

    res.json({ message: 'Loan repayment successful', balance: wallet.balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  applyLoan,
  listLoans,
  getLoan,
  repayLoan
};

