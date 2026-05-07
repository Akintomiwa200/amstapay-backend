const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  application: {
    purpose: {
      type: String,
      enum: ['PERSONAL', 'BUSINESS', 'EDUCATION', 'MEDICAL', 'HOME_IMPROVEMENT', 'OTHER'],
      required: true
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
      max: 60 // max 60 months
    },
    employmentStatus: {
      type: String,
      enum: ['EMPLOYED', 'SELF_EMPLOYED', 'UNEMPLOYED', 'STUDENT', 'RETIRED', 'BUSINESS_OWNER'],
      required: true
    },
    monthlyIncome: {
      type: Number,
      required: true,
      min: 0
    },
    guarantorDetails: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String },
      relationship: { type: String },
      address: { type: String }
    },
    collateralDescription: String
  },
  amount: {
    type: Number,
    required: true,
    min: 5000
  },
  interestRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  termMonths: {
    type: Number,
    required: true
  },
  monthlyInstallment: {
    type: Number,
    required: true
  },
  totalRepayable: {
    type: Number,
    required: true
  },
  totalPaid: {
    type: Number,
    default: 0
  },
  outstandingBalance: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'DISBURSED', 'ACTIVE', 'COMPLETED', 'DEFAULTED', 'REJECTED', 'CANCELLED'],
    default: 'PENDING'
  },
  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    note: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  disbursement: {
    amount: Number,
    date: Date,
    method: { type: String, enum: ['wallet', 'bank_transfer', 'cash'] },
    reference: String
  },
  repaymentSchedule: [{
    dueDate: Date,
    amountDue: Number,
    amountPaid: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'paid', 'overdue', 'partial'] },
    payments: [{
      amount: Number,
      paymentDate: Date,
      method: String,
      reference: String
    }]
  }],
  nextPaymentDate: Date,
  nextPaymentAmount: Number,
  creditScore: {
    score: Number,
    provider: String,
    retrievedAt: Date
  },
  riskAssessment: {
    level: String,
    notes: String
  },
  rejectionReason: String,
  reference: {
    type: String,
    unique: true
  },
  metadata: {
    workId: String,
    employerName: String,
    businessName: String,
    yearsInBusiness: Number
  }
}, {
  timestamps: true
});

// Indexes
loanSchema.index({ user: -1, createdAt: -1 });
loanSchema.index({ status: 1 });

module.exports = mongoose.model('Loan', loanSchema);

