const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1000
  },
  type: {
    type: String,
    enum: ['mutual-fund', 'stocks', 'treasury-bills', 'bonds'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'matured', 'withdrawn'],
    default: 'active'
  },
  expectedReturns: {
    type: Number,
    default: 0
  },
  currentValue: {
    type: Number,
    default: 0
  },
  maturityDate: Date,
  reference: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Investment', investmentSchema);
