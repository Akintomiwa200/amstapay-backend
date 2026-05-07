const CashbackReward = require("../models/CashbackReward");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

const CASHBACK_RATES = {
  airtime: 0.01, data: 0.01, electricity: 0.005,
  cable: 0.01, transfer: 0.002, bill_payment: 0.005,
  merchant_payment: 0.01, schoolfees: 0.005,
};

exports.awardCashback = async (userId, transactionType, amount, transactionId) => {
  try {
    const rate = CASHBACK_RATES[transactionType] || 0;
    if (rate <= 0 || amount <= 0) return;

    const cashbackAmount = Math.round(amount * rate * 100) / 100;
    if (cashbackAmount < 1) return;

    const reward = await CashbackReward.create({
      user: userId, type: "cashback", amount: cashbackAmount,
      description: `${rate * 100}% cashback on ${transactionType}`,
      source: transactionType, sourceTransaction: transactionId,
      status: "pending", expiresAt: new Date(Date.now() + 90 * 86400000),
    });

    const wallet = await Wallet.findOne({ user: userId });
    if (wallet) {
      wallet.balance += cashbackAmount;
      wallet.ledger.push({ type: "credit", amount: cashbackAmount, description: `Cashback: ${transactionType}` });
      await wallet.save();
    }

    reward.status = "credited";
    reward.creditedAt = new Date();
    await reward.save();
  } catch (err) {
    console.error("Cashback award error:", err.message);
  }
};

exports.listRewards = async (req, res) => {
  try {
    const rewards = await CashbackReward.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    const totalEarned = rewards.filter(r => r.status === "credited").reduce((s, r) => s + r.amount, 0);
    res.json({ success: true, totalEarned, count: rewards.length, data: rewards });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.awardLoyaltyPoints = async (userId, amount) => {
  try {
    const points = Math.floor(amount / 100);
    if (points <= 0) return;

    await CashbackReward.create({
      user: userId, type: "loyalty_points", amount: points,
      description: `${points} loyalty points earned`,
      source: "transaction", status: "credited", creditedAt: new Date(),
    });
  } catch (err) {
    console.error("Loyalty points error:", err.message);
  }
};
