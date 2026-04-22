const Investment = require('../models/Investment');
const Wallet = require('../models/Wallet');

// Create investment
exports.createInvestment = async (req, res) => {
  try {
    const { amount, type, maturityMonths } = req.body;
    const userId = req.user._id;

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });

    wallet.balance -= amount;
    await wallet.save();

    const investment = await Investment.create({
      user: userId,
      amount,
      type,
      maturityDate: new Date(Date.now() + maturityMonths * 30 * 24 * 60 * 60 * 1000),
      reference: 'INV-' + Date.now()
    });

    res.status(201).json({ message: 'Investment created successfully', investment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// List investments
exports.listInvestments = async (req, res) => {
  try {
    const userId = req.user._id;
    const investments = await Investment.find({ user: userId }).sort({ createdAt: -1 });
    res.json(investments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get investment details
exports.getInvestment = async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id).populate('user');
    if (investment.user._id.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Unauthorized' });
    res.json(investment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createInvestment,
  listInvestments,
  getInvestment
};

