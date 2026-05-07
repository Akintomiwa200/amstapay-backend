const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['airtime', 'data', 'electricity', 'schoolfees', 'transport', 'tv', 'cable'],
    required: true
  },
  provider: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  phoneNumber: String,
  meterNumber: String,
  reference: {
    type: String,
    unique: true
  },
  meterType: {
    type: String,
    enum: ['PREPAID', 'POSTPAID'],
    default: 'PREPAID'
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  metadata: {
    studentId: String,
    session: String,
    term: String,
    route: String,
    transportType: String,
    bookingRef: String,
    token: String
  },
  externalReference: String, // Paystack/biller reference
  paidAt: Date
}, {
  timestamps: true
});

// Indexes
billSchema.index({ user: -1, createdAt: -1 });

module.exports = mongoose.model('Bill', billSchema);

