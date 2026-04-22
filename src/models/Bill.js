const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['airtime', 'data', 'electricity', 'schoolfees', 'transport', 'tv'],
    required: true
  },
  provider: String,
  amount: {
    type: Number,
    required: true
  },
  meterNumber: String,
  phoneNumber: String,
  reference: String,
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Bill', billSchema);

