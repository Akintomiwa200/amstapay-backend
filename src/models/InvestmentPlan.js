const mongoose = require('mongoose');

const investmentPlanSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  type: {
    type: String,
    enum: ['mutual-fund', 'stocks', 'treasury-bills', 'bonds', 'fixed-savings', 'high-yield'],
    required: true
  },
  roi: {
    type: Number,
    required: true,
    description: 'Annual percentage yield'
  },
  durations: [{
    months: { type: Number, required: true },
    minAmount: { type: Number, required: true },
    maxAmount: { type: Number },
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' }
  }],
  minInvestment: {
    type: Number,
    required: true
  },
  maxInvestment: {
    type: Number
  },
  isActive: {
    type: Boolean,
    default: true
  },
  features: [{
    title: String,
    description: String
  }],
  payoutSchedule: {
    type: String,
    enum: ['monthly', 'quarterly', 'at-maturity', 'daily'],
    default: 'at-maturity'
  },
  liquidity: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes
investmentPlanSchema.index({ code: 1, isActive: 1 });
investmentPlanSchema.index({ type: 1, isActive: 1 });

module.exports = mongoose.model('InvestmentPlan', investmentPlanSchema);
