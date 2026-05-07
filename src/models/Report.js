const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'Financial Statement'
  },
  type: {
    type: String,
    enum: ['statement', 'budget-insights', 'tax', 'cashflow', 'custom'],
    required: true
  },
  period: {
    type: String, // '2024-09' for monthly, '2024-Q3' for quarterly
    required: true
  },
  dateRange: {
    startDate: Date,
    endDate: Date
  },
  data: {
    transactions: { type: Number, default: 0 },
    categories: { type: Map, of: Number, default: {} },
    breakdown: {
      bills: { type: Number, default: 0 },
      transfers: { type: Number, default: 0 },
      investments: { type: Number, default: 0 },
      loans: { type: Number, default: 0 },
      withdrawals: { type: Number, default: 0 },
      airtime: { type: Number, default: 0 },
      data: { type: Number, default: 0 },
      electricity: { type: Number, default: 0 }
    },
    topMerchants: [{
      name: String,
      amount: Number,
      count: Number
    }],
    trends: [{
      period: String,
      income: Number,
      expense: Number
    }],
    budgetHealth: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', null],
      default: null
    },
    advice: [String],
    metrics: {
      avgMonthlyIncome: Number,
      avgMonthlyExpense: Number,
      savingsRate: Number,
      currentBalance: Number
    }
  },
  totalIncome: { type: Number, default: 0 },
  totalExpense: { type: Number, default: 0 },
  netSavings: { type: Number, default: 0 },
  format: {
    type: String,
    enum: ['json', 'pdf', 'csv'],
    default: 'json'
  },
  fileUrl: String, // PDF export URL
  exportedAt: Date,
  sharedWith: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sharedAt: { type: Date, default: Date.now },
    permission: { type: String, enum: ['view', 'download'], default: 'view' }
  }]
}, {
  timestamps: true
});

// Index for fast querying
reportSchema.index({ user: 1, createdAt: -1 });
reportSchema.index({ user: 1, type: 1, period: 1 });

module.exports = mongoose.model('Report', reportSchema);
