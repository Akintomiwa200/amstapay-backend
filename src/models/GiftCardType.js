const mongoose = require('mongoose');

const giftCardTypeSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Shopping', 'Entertainment', 'Gaming', 'Food', 'Travel', 'Entertainment'],
    default: 'Shopping'
  },
  description: {
    type: String
  },
  availableDenominations: [{
    type: Number,
    required: true
  }],
  currencies: [{
    type: String,
    enum: ['USD', 'EUR', 'GBP', 'NGN'],
    default: ['USD']
  }],
  imageUrl: String,
  isActive: {
    type: Boolean,
    default: true
  },
  expiryPeriod: {
    type: Number,
    default: 365 // days
  },
  fees: {
    type: Number,
    default: 0 // percentage fee
  },
  limits: {
    min: { type: Number, default: 10 },
    max: { type: Number, default: 1000 }
  }
}, {
  timestamps: true
});

// Index for searching
giftCardTypeSchema.index({ code: 1, isActive: 1 });
giftCardTypeSchema.index({ category: 1 });

module.exports = mongoose.model('GiftCardType', giftCardTypeSchema);
