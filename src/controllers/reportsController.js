const Report = require('../models/Report');
const Transaction = require('../models/Transaction');

// Generate statement
exports.generateStatement = async (req, res) => {
  try {
    const { period } = req.body; // '2024-09'
    const userId = req.user._id;

    const transactions = await Transaction.find({ user: userId, createdAt: { $regex: period, $options: 'i' } });

    const totalIncome = transactions.filter(t => ['fund', 'transfer_received'].includes(t.type)).reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => ['transfer', 'withdraw', 'bill_payment'].includes(t.type)).reduce((sum, t) => sum + t.amount, 0);

    const report = await Report.create({
      user: userId,
      type: 'statement',
      period,
      data: { transactions: transactions.length, categories: {} },
      totalIncome,
      totalExpense
    });

    res.json({ message: 'Statement generated', report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Budget insights
exports.budgetInsights = async (req, res) => {
  try {
    const { period } = req.body;
    const userId = req.user._id;

    // Mock insights
    const insights = {
      spendingCategories: { 'bills': 30, 'transfers': 50, 'withdraw': 20 },
      advice: 'Reduce bills spending by 10%',
      projectedBalance: 5000
    };

    res.json({ insights });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  generateStatement,
  budgetInsights
};
