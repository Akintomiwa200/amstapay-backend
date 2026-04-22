const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  interestRate: {
    type: Number,
    default: 5.0 // %
  },
  termMonths: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'active', 'repaid', 'defaulted'],
    default: 'pending'
  },
  monthlyPayment: {
    type: Number,
    default: 0
  },
  totalRepaid: {
    type: Number,
    default: 0
  },
  collateral: String, // optional
  guarantor: {
    name: String,
    phone: String
  },
  reference: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Loan', loanSchema);

