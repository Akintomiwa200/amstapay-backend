const Expense = require("../models/Expense");

exports.addExpense = async (req, res) => {
  try {
    const { amount, category, description, date, type, paymentMethod, tags, location } = req.body;
    if (!amount || !category || !description) return res.status(400).json({ message: "amount, category, description required" });

    const expense = await Expense.create({
      user: req.user._id, amount, category, description,
      date: date || new Date(), type: type || "expense",
      paymentMethod: paymentMethod || "wallet", tags, location,
    });

    res.status(201).json({ message: "Expense logged", data: expense });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, type, startDate, endDate } = req.query;
    const filter = { user: req.user._id };
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(filter).sort({ date: -1 }).skip((page - 1) * limit).limit(parseInt(limit)).lean();
    const total = await Expense.countDocuments(filter);

    const summary = await Expense.aggregate([
      { $match: { user: req.user._id, type: "expense" } },
      { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    res.json({
      success: true, count: expenses.length, total,
      page: parseInt(page), pages: Math.ceil(total / limit),
      summary, data: expenses,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
