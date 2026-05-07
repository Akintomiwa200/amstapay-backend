const Report = require('../models/Report');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const Bill = require('../models/Bill');
const Investment = require('../models/Investment');
const Loan = require('../models/Loan');

// Helper to calculate stats
const calculatePeriodStats = async (userId, period) => {
  // Parse period "2024-09" to date range
  const [year, month] = period.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1); // first day of next month

  const transactions = await Transaction.find({
    user: userId,
    createdAt: { $gte: startDate, $lt: endDate }
  });

  const totalIncome = transactions
    .filter(t => ['fund', 'transfer_received', 'web3_deposit', 'crypto_payment'].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => ['transfer', 'withdraw', 'bill_payment', 'airtime', 'data', 'electricity', 'international_transfer', 'web3_withdrawal'].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);

  return { totalIncome, totalExpense, transactions };
};

// --------------------
// Generate Statement
// --------------------
exports.generateStatement = async (req, res) => {
  try {
    const { period, reportType = "monthly", format = "json" } = req.body;
    const userId = req.user._id;

    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid period format. Use YYYY-MM" 
      });
    }

    const { totalIncome, totalExpense, transactions } = await calculatePeriodStats(userId, period);

    // Build category breakdown
    const categories = {};
    transactions.forEach(t => {
      const cat = t.type;
      categories[cat] = (categories[cat] || 0) + t.amount;
    });

    // Get additional bills data
    const [bills, investments, loans] = await Promise.all([
      Bill.find({ user: userId, createdAt: { $gte: new Date(period + '-01'), $lt: new Date(period + '-01') + 30*24*60*60*1000 } }),
      Investment.find({ user: userId, createdAt: { $gte: new Date(period + '-01'), $lt: new Date(period + '-01') + 30*24*60*60*1000 } }),
      Loan.find({ user: userId, createdAt: { $gte: new Date(period + '-01'), $lt: new Date(period + '-01') + 30*24*60*60*1000 } })
    ]);

    // Build report
    const report = await Report.create({
      user: userId,
      type: 'statement',
      period,
      data: {
        transactions: transactions.length,
        categories,
        bills: bills.length,
        investments: investments.length,
        loans: loans.length,
        breakdown: {
          bills: bills.reduce((sum, b) => sum + b.amount, 0),
          investments: investments.reduce((sum, i) => sum + i.amount, 0),
          loans: loans.reduce((sum, l) => sum + l.amount, 0)
        }
      },
      totalIncome,
      totalExpense,
      fileUrl: format === 'pdf' ? `/reports/${report._id}.pdf` : null
    });

    const response = {
      message: "Statement generated successfully",
      report: {
        period: report.period,
        reportType,
        totalIncome: report.totalIncome,
        totalExpense: report.totalExpense,
        netSavings: report.totalIncome - report.totalExpense,
        categories: report.data.categories,
        transactionCount: report.data.transactions,
        generatedAt: report.createdAt
      }
    };

    if (format === 'pdf') {
      // TODO: Generate PDF using puppeteer/handlebars
      response.report.pdfUrl = report.fileUrl;
    }

    res.json(response);
  } catch (err) {
    console.error("Generate statement error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to generate statement", 
      error: err.message 
    });
  }
};

// --------------------
// Budget Insights
// --------------------
exports.budgetInsights = async (req, res) => {
  try {
    const { period = "monthly", startDate, endDate } = req.query;
    const userId = req.user._id;

    // Get last 6 months data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const transactions = await Transaction.find({
      user: userId,
      createdAt: { $gte: sixMonthsAgo }
    });

    // Calculate spending by category
    const spendingCategories = {};
    transactions.forEach(t => {
      const cat = t.type;
      if (!spendingCategories[cat]) spendingCategories[cat] = 0;
      spendingCategories[cat] += t.amount;
    });

    // Calculate total spending
    const totalSpending = Object.values(spendingCategories).reduce((a, b) => a + b, 0);

    // Find top merchants (simplified - using receiverName)
    const merchantSpending = {};
    transactions.forEach(t => {
      if (t.receiverName) {
        merchantSpending[t.receiverName] = (merchantSpending[t.receiverName] || 0) + t.amount;
      }
    });
    const topMerchants = Object.entries(merchantSpending)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }));

    // Calculate monthly trends
    const trends = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthStats = await calculatePeriodStats(userId, monthKey);
      trends.push({
        month: monthKey,
        income: monthStats.totalIncome,
        expense: monthStats.totalExpense
      });
    }

    // Get wallet balance for projection
    const wallet = await Wallet.findOne({ user: userId });
    const currentBalance = wallet ? wallet.balance : 0;

    // Budget health assessment
    let budgetHealth = "excellent";
    const avgMonthlyExpense = trends.reduce((sum, t) => sum + t.expense, 0) / 6;
    const avgMonthlyIncome = trends.reduce((sum, t) => sum + t.income, 0) / 6;

    if (avgMonthlyIncome > 0) {
      const expenseRatio = avgMonthlyExpense / avgMonthlyIncome;
      if (expenseRatio > 0.9) budgetHealth = "poor";
      else if (expenseRatio > 0.75) budgetHealth = "fair";
      else if (expenseRatio > 0.6) budgetHealth = "good";
    }

    // Generate advice
    const advice = [];
    const maxCategory = Object.entries(spendingCategories).sort((a, b) => b[1] - a[1])[0];
    if (maxCategory && maxCategory[1] / totalSpending > 0.4) {
      advice.push(`You're spending ${Math.round(maxCategory[1]/totalSpending*100)}% on ${maxCategory[0]}. Consider optimizing this category.`);
    }
    if (currentBalance < avgMonthlyExpense * 3) {
      advice.push("Build emergency fund: aim for 3-6 months of expenses");
    }
    if (trends[trends.length - 1].expense > trends[trends.length - 2].expense) {
      advice.push("Your spending increased this month. Review your recent expenses.");
    }

    // Projected balance
    const projectedBalance = currentBalance + avgMonthlyIncome - avgMonthlyExpense;

    res.json({
      insights: {
        period,
        spendingCategories,
        totalSpending,
        topMerchants,
        trends,
        budgetHealth,
        advice,
        metrics: {
          avgMonthlyIncome,
          avgMonthlyExpense,
          savingsRate: avgMonthlyIncome > 0 ? (avgMonthlyIncome - avgMonthlyExpense) / avgMonthlyIncome : 0,
          currentBalance
        },
        projectedBalance: Math.round(projectedBalance)
      }
    });
  } catch (err) {
    console.error("Budget insights error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to generate insights", 
      error: err.message 
    });
  }
};

// --------------------
// Get Report by ID
// --------------------
exports.getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId)
      .populate('user', 'fullName email');

    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: "Report not found" 
      });
    }

    // Check ownership
    if (report.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied" 
      });
    }

    res.json({ 
      success: true, 
      report 
    });
  } catch (err) {
    console.error("Get report error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to retrieve report", 
      error: err.message 
    });
  }
};

// --------------------
// Delete Report
// --------------------
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId);

    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: "Report not found" 
      });
    }

    // Check ownership
    if (report.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied" 
      });
    }

    await Report.findByIdAndDelete(req.params.reportId);
    res.json({ 
      success: true, 
      message: "Report deleted successfully" 
    });
  } catch (err) {
    console.error("Delete report error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete report", 
      error: err.message 
    });
  }
};

// --------------------
// Export Report
// --------------------
exports.exportReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { format = 'pdf' } = req.query;

    const report = await Report.findById(reportId)
      .populate('user', 'fullName email');

    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: "Report not found" 
      });
    }

    // Check ownership
    if (report.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied" 
      });
    }

    if (format === 'json') {
      return res.json({ 
        success: true, 
        report: {
          period: report.period,
          type: report.type,
          totalIncome: report.totalIncome,
          totalExpense: report.totalExpense,
          data: report.data,
          exportedAt: new Date().toISOString()
        }
      });
    }

    if (format === 'pdf') {
      const PDFDocument = require("pdfkit");
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="statement-${report.period}.pdf"`);
      doc.pipe(res);

      doc.fontSize(20).font("Helvetica-Bold").text("AmstaPay Financial Statement", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).font("Helvetica").text(`Period: ${report.period}`, { align: "center" });
      doc.text(`Generated: ${new Date().toLocaleDateString("en-NG")}`);
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      doc.font("Helvetica-Bold").fontSize(14).text(`Total Income: ₦${(report.totalIncome || 0).toLocaleString()}`);
      doc.font("Helvetica").fontSize(14).text(`Total Expense: ₦${(report.totalExpense || 0).toLocaleString()}`);
      const net = (report.totalIncome || 0) - (report.totalExpense || 0);
      doc.font("Helvetica-Bold").fontSize(14).fillColor(net >= 0 ? "green" : "red").text(`Net: ₦${net.toLocaleString()}`);
      doc.fillColor("black");
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      if (report.data?.categories) {
        doc.font("Helvetica-Bold").fontSize(16).text("Category Breakdown");
        doc.moveDown();
        doc.font("Helvetica").fontSize(12);
        for (const [cat, amt] of Object.entries(report.data.categories)) {
          doc.text(`${cat.padEnd(30)} ₦${(amt || 0).toLocaleString()}`);
        }
      }

      if (report.data?.transactions?.length > 0) {
        doc.addPage();
        doc.font("Helvetica-Bold").fontSize(16).text("Transaction History");
        doc.moveDown();
        doc.font("Helvetica").fontSize(10);
        for (const txn of report.data.transactions.slice(0, 50)) {
          doc.text(`${new Date(txn.date).toLocaleDateString()}  ${txn.description?.slice(0, 50).padEnd(50)}  ₦${(txn.amount || 0).toLocaleString()}`);
        }
      }

      doc.end();
      return;
    }

    // CSV export
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="statement-${report.period}.csv"`);

      let csv = 'Category,Amount\n';
      if (report.data && report.data.categories) {
        Object.entries(report.data.categories).forEach(([cat, amount]) => {
          csv += `${cat},${amount}\n`;
        });
      }
      res.send(csv);
      return;
    }

    res.status(400).json({ 
      success: false, 
      message: "Unsupported export format" 
    });
  } catch (err) {
    console.error("Export report error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to export report", 
      error: err.message 
    });
  }
};
