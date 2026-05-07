const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InvestmentPlan',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1000
  },
  duration: {
    months: { type: Number, required: true },
    startDate: { type: Date, default: Date.now },
    endDate: Date
  },
  roi: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'matured', 'withdrawn', 'cancelled', 'pending'],
    default: 'pending'
  },
  autoReinvest: {
    type: Boolean,
    default: false
  },
  expectedReturns: {
    type: Number,
    required: true
  },
  currentValue: {
    type: Number,
    default: 0
  },
  accruedInterest: {
    type: Number,
    default: 0
  },
  transactions: [{
    type: { type: String, enum: ['deposit', 'interest', 'withdrawal', 'maturity'] },
    amount: Number,
    date: { type: Date, default: Date.now },
    description: String
  }],
  reference: {
    type: String,
    unique: true
  },
  payoutSchedule: {
    type: String,
    enum: ['monthly', 'quarterly', 'at-maturity', 'daily'],
    default: 'at-maturity'
  },
  nextPayoutDate: Date,
  notes: String
}, {
  timestamps: true
});

// Indexes
investmentSchema.index({ user: -1, createdAt: -1 });
investmentSchema.index({ status: 1 });

// Pre-save hook to calculate maturity and next payout
investmentSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('duration') || this.isModified('startDate')) {
    this.duration.endDate = new Date(this.duration.startDate);
    this.duration.endDate.setMonth(this.duration.endDate.getMonth() + this.duration.months);
    
    // Set next payout date based on schedule
    if (this.payoutSchedule === 'monthly') {
      this.nextPayoutDate = new Date(this.duration.startDate);
      this.nextPayoutDate.setMonth(this.nextPayoutDate.getMonth() + 1);
    } else if (this.payoutSchedule === 'at-maturity') {
      this.nextPayoutDate = this.duration.endDate;
    } else {
      this.nextPayoutDate = this.duration.endDate;
    }
  }
  next();
});

module.exports = mongoose.model('Investment', investmentSchema);
