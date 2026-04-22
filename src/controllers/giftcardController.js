const GiftCard = require('../models/GiftCard');
const Wallet = require('../models/Wallet');

// Buy giftcard
exports.buyGiftcard = async (req, res) => {
  try {
    const { type, amount } = req.body;
    const userId = req.user._id;

    const wallet = await Wallet.findOne({ user: userId });

    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    wallet.balance -= amount;
    await wallet.save();

    const giftcard = await GiftCard.create({
      user: userId,
      type,
      balance: amount,
      history: [{
        amount,
        type: 'purchase',
        code: 'GC-' + Date.now()
      }]
    });

    res.status(201).json({
      message: 'Giftcard purchased successfully',
      giftcard
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get user giftcards
exports.getGiftcards = async (req, res) => {
  try {
    const cards = await GiftCard.find({ user: req.user._id });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  buyGiftcard,
  getGiftcards
};