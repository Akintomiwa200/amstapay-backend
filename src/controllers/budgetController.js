const { CategoryBudget, TransactionCategory, CATEGORIES } = require("../models/CategoryBudget");
const Transaction = require("../models/Transaction");

const CATEGORY_RULES = [
  { match: /airtime|call|phone/, category: "airtime" },
  { match: /data|internet|bundle/, category: "data" },
  { match: /electricity|light|power/, category: "utilities" },
  { match: /transport|fuel|bus|taxi|uber|bolt/, category: "transport" },
  { match: /food|restaurant|grocery|supermarket/, category: "food" },
  { match: /rent|mortgage|house/, category: "rent" },
  { match: /school|tuition|course|class/, category: "education" },
  { match: /health|hospital|doctor|pharmacy|drug/, category: "health" },
  { match: /entertain|movie|game|sport|bet/, category: "entertainment" },
  { match: /shop|store|mall|cloth|electronics/, category: "shopping" },
  { match: /bill|cable|dstv|gotv/, category: "bills" },
  { match: /save|savings|investment/, category: "savings" },
  { match: /transfer|send/, category: "transfer" },
  { match: /withdraw|cash/, category: "withdrawal" },
];

exports.classifyTransaction = (description, type) => {
  const text = `${description || ""} ${type || ""}`.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.match.test(text)) return rule.category;
  }
  return "other";
};

exports.setBudget = async (req, res) => {
  try {
    const { category, monthlyLimit, alertAtPercent } = req.body;
    if (!category || !monthlyLimit) return res.status(400).json({ message: "category and monthlyLimit required" });
    if (!CATEGORIES.includes(category)) return res.status(400).json({ message: `Invalid category. Must be: ${CATEGORIES.join(", ")}` });

    const now = new Date();
    const budget = await CategoryBudget.findOneAndUpdate(
      { user: req.user._id, category, month: now.getMonth() + 1, year: now.getFullYear() },
      { monthlyLimit, alertAtPercent: alertAtPercent || 80, alertsEnabled: true },
      { upsert: true, new: true },
    );

    res.json({ message: "Budget set", data: budget });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listBudgets = async (req, res) => {
  try {
    const now = new Date();
    const budgets = await CategoryBudget.find({
      user: req.user._id, month: now.getMonth() + 1, year: now.getFullYear(),
    }).lean();

    const withPercentages = budgets.map(b => ({
      ...b,
      percentUsed: b.monthlyLimit > 0 ? Math.round((b.spent / b.monthlyLimit) * 10000) / 100 : 0,
      remaining: Math.max(0, b.monthlyLimit - b.spent),
    }));

    const now2 = new Date();
    const spending = await TransactionCategory.aggregate([
      { $match: { user: req.user._id, createdAt: { $gte: new Date(now2.getFullYear(), now2.getMonth(), 1) } } },
      { $group: { _id: "$category", total: { $sum: 1 } } },
    ]);

    res.json({ success: true, budgets: withPercentages, spending });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSpendingInsights = async (req, res) => {
  try {
    const { period = "month" } = req.query;
    const now = new Date();
    let startDate;
    if (period === "month") startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (period === "week") startDate = new Date(now.getTime() - 7 * 86400000);
    else startDate = new Date(now.getFullYear(), 0, 1);

    const categories = await TransactionCategory.aggregate([
      { $match: { user: req.user._id, createdAt: { $gte: startDate } } },
      { $group: { _id: "$category", count: { $sum: 1 }, lastTransaction: { $max: "$createdAt" } } },
      { $sort: { count: -1 } },
    ]);

    const transactions = await Transaction.find({ sender: req.user._id, createdAt: { $gte: startDate } }).lean();
    const totalSpent = transactions.reduce((s, t) => s + (t.amount || 0), 0);
    const totalReceived = transactions.filter(t => t.type === "fund").reduce((s, t) => s + (t.amount || 0), 0);
    const avgTransaction = transactions.length > 0 ? totalSpent / transactions.length : 0;

    res.json({
      success: true, data: {
        period, totalSpent, totalReceived, avgTransaction, transactionCount: transactions.length,
        topCategories: categories.slice(0, 5),
        allCategories: categories,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.setCategory = async (req, res) => {
  try {
    const { transactionId, category } = req.body;
    if (!transactionId || !category) return res.status(400).json({ message: "transactionId and category required" });
    if (!CATEGORIES.includes(category)) return res.status(400).json({ message: `Invalid category: ${category}` });

    const tx = await Transaction.findById(transactionId);
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    await TransactionCategory.findOneAndUpdate(
      { user: req.user._id, transaction: transactionId },
      { category, classifiedBy: "user" },
      { upsert: true, new: true },
    );

    res.json({ message: "Category set" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
