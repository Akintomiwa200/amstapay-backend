const mongoose = require('mongoose');

const giftCardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['amazon', 'itunes', 'google-play', 'steam', 'netflix'],
    required: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  history: [{
    amount: Number,
    type: { type: String, enum: ['purchase', 'topup'] },
    code: String,
    date: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['active', 'expired', 'suspended'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GiftCard', giftCardSchema);

