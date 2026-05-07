const GiftCard = require('../models/GiftCard');
const GiftCardType = require('../models/GiftCardType');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { sendGiftCardPurchaseEmail, sendGiftCardToRecipient } = require('../services/emailService');
const { sendOTP } = require('../services/customNotificationService');
const crypto = require('crypto');

// --------------------
// Get available giftcard catalog
// --------------------
exports.getGiftcards = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, currency } = req.query;
    const filter = { isActive: true };

    if (category) {
      filter.category = category;
    }
    if (currency) {
      filter.currencies = { $in: [currency] };
    }

    const giftCardTypes = await GiftCardType.find(filter)
      .select('-fees -limits -createdAt -updatedAt');

    // Apply price filtering on first denomination
    const filtered = giftCardTypes.filter(type => {
      const denom = type.availableDenominations[0];
      if (minPrice && denom < Number(minPrice)) return false;
      if (maxPrice && denom > Number(maxPrice)) return false;
      return true;
    });

    res.json({
      success: true,
      count: filtered.length,
      giftcards: filtered
    });
  } catch (err) {
    console.error("Get giftcards error:", err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve gift cards', 
      error: err.message 
    });
  }
};

// --------------------
// Buy giftcard
// --------------------
exports.buyGiftcard = async (req, res) => {
  try {
    const { giftcardId, amount, recipientEmail, recipientName, message, currency = "USD" } = req.body;
    const userId = req.user._id;

    if (!giftcardId || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'giftcardId and amount are required' 
      });
    }

    // Find gift card type
    const giftCardType = await GiftCardType.findOne({ 
      code: giftcardId, 
      isActive: true 
    });

    if (!giftCardType) {
      return res.status(404).json({ 
        success: false, 
        message: 'Gift card type not found' 
      });
    }

    // Validate amount against allowed denominations
    const isValidDenomination = giftCardType.availableDenominations.includes(amount);
    if (!isValidDenomination) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid amount. Allowed denominations: ${giftCardType.availableDenominations.join(', ')} ${currency}` 
      });
    }

    // Validate currency
    if (!giftCardType.currencies.includes(currency)) {
      return res.status(400).json({ 
        success: false, 
        message: `Currency not supported for this gift card. Supported: ${giftCardType.currencies.join(', ')}` 
      });
    }

    // Check wallet balance
    const wallet = await Wallet.findOne({ user: userId });
    const totalCost = amount; // could include fees
    if (!wallet || wallet.balance < totalCost) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient wallet balance' 
      });
    }

    // Deduct wallet
    wallet.balance -= totalCost;
    await wallet.save();

    // Generate unique gift card code
    const giftCardCode = `GIFT-${crypto.randomBytes(12).toString('hex').toUpperCase()}`;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (giftCardType.expiryPeriod || 365));

    // Create gift card
    const giftCard = await GiftCard.create({
      user: userId,
      giftCardType: giftCardType._id,
      giftCardCode,
      recipientEmail,
      recipientName,
      message,
      currency,
      originalAmount: amount,
      currentBalance: amount,
      purchasedAmount: amount,
      feeAmount: 0,
      expiresAt: expiryDate
    });

    // Create transaction
    const transaction = await Transaction.create({
      user: userId,
      type: 'giftcard_purchase',
      amount,
      description: `Purchased ${giftCardType.name} gift card for ${recipientName || 'self'}`,
      status: 'completed',
      reference: giftCardCode
    });

    // Link transaction to gift card
    giftCard.transaction = transaction._id;
    await giftCard.save();

    // Send notifications
    await sendGiftCardPurchaseEmail({
      email: req.user.email,
      fullName: req.user.fullName,
      giftCard: {
        code: giftCardCode,
        name: giftCardType.name,
        amount,
        currency,
        recipient: recipientName || req.user.fullName,
        expiry: expiryDate.toISOString().split('T')[0]
      }
    });

    if (recipientEmail && recipientEmail !== req.user.email) {
      await sendGiftCardToRecipient({
        recipientEmail,
        recipientName,
        senderName: req.user.fullName,
        giftCardCode,
        amount,
        currency,
        message
      });
    }

    res.status(201).json({ 
      success: true, 
      message: 'Gift card purchased successfully',
      data: {
        giftCard: {
          id: giftCard._id,
          code: giftCardCode,
          type: giftCardType.name,
          amount,
          currency,
          expiryDate,
          recipientEmail,
          recipientName
        },
        transaction: {
          id: transaction._id,
          reference: transaction.reference,
          status: transaction.status
        },
        balance: wallet.balance
      }
    });
  } catch (err) {
    console.error("Buy giftcard error:", err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to purchase gift card', 
      error: err.message 
    });
  }
};

// --------------------
// Get single giftcard
// --------------------
exports.getGiftcard = async (req, res) => {
  try {
    const giftCard = await GiftCard.findById(req.params.id)
      .populate('giftCardType', 'name code imageUrl')
      .populate('transaction', 'reference status createdAt');

    if (!giftCard) {
      return res.status(404).json({ 
        success: false, 
        message: 'Gift card not found' 
      });
    }

    // Check ownership
    if (giftCard.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    res.json({ 
      success: true, 
      giftCard 
    });
  } catch (err) {
    console.error("Get giftcard error:", err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve gift card', 
      error: err.message 
    });
  }
};

// --------------------
// Get user's purchased giftcards
// --------------------
exports.getMyGiftcards = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { user: userId };
    if (status) filter.status = status;

    const giftcards = await GiftCard.find(filter)
      .populate('giftCardType', 'name code imageUrl')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await GiftCard.countDocuments(filter);

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      giftcards
    });
  } catch (err) {
    console.error("Get my giftcards error:", err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve gift cards',
      error: err.message
    });
  }
};

// --------------------
// Redeem giftcard
// --------------------
exports.redeemGiftcard = async (req, res) => {
  try {
    const giftCard = await GiftCard.findById(req.params.id)
      .populate('giftCardType')
      .populate('user');

    if (!giftCard) {
      return res.status(404).json({ 
        success: false, 
        message: 'Gift card not found' 
      });
    }

    // Check ownership
    if (giftCard.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // Check if already redeemed/expired
    if (giftCard.status !== 'active') {
      return res.status(400).json({ 
        success: false, 
        message: `Gift card is ${giftCard.status}` 
      });
    }

    // Check expiry
    if (giftCard.expiresAt && new Date() > giftCard.expiresAt) {
      giftCard.status = 'expired';
      await giftCard.save();
      return res.status(400).json({ 
        success: false, 
        message: 'Gift card has expired' 
      });
    }

    const { applyToWallet = false } = req.body;

    // Redeem logic
    giftCard.status = 'redeemed';
    giftCard.redeemedAt = new Date();
    giftCard.redeemedBy = req.user._id;

    // If applyToWallet, add balance to wallet
    if (applyToWallet) {
      const wallet = await Wallet.findOne({ user: req.user._id });
      if (wallet) {
        wallet.balance += giftCard.currentBalance;
        await wallet.save();

        // Record transaction
        await Transaction.create({
          user: req.user._id,
          type: 'giftcard_redemption',
          amount: giftCard.currentBalance,
          description: `Gift card redemption: ${giftCard.giftCardType.name}`,
          status: 'completed'
        });
      }
    }

    await giftCard.save();

    res.json({ 
      success: true, 
      message: 'Gift card redeemed successfully',
      data: {
        redeemedAmount: giftCard.currentBalance,
        appliedToWallet: applyToWallet,
        status: giftCard.status
      }
    });
  } catch (err) {
    console.error("Redeem giftcard error:", err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to redeem gift card', 
      error: err.message 
    });
  }
};