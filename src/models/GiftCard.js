const mongoose = require('mongoose');
const crypto = require('crypto');

const giftCardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  giftCardType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GiftCardType',
    required: true
  },
  giftCardCode: {
    type: String,
    unique: true,
    required: true
  },
  recipientEmail: String,
  recipientName: String,
  message: String,
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP', 'NGN'],
    default: 'USD'
  },
  originalAmount: {
    type: Number,
    required: true
  },
  currentBalance: {
    type: Number,
    default: 0
  },
  purchasedAmount: {
    type: Number,
    required: true
  },
  feeAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'redeemed', 'expired', 'cancelled'],
    default: 'active'
  },
  expiresAt: Date,
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  redeemedAt: Date,
  redeemedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
giftCardSchema.index({ user: -1, createdAt: -1 });
giftCardSchema.index({ recipientEmail: 1 });

// Generate gift card code before saving
giftCardSchema.pre('save', async function () {
  if (this.isNew && !this.giftCardCode) {
    const code = 'GIFT-' + crypto.randomBytes(16).toString('hex').toUpperCase();
    this.giftCardCode = code;
  }
});

module.exports = mongoose.model('GiftCard', giftCardSchema);

