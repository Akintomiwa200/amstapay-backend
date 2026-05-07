const VirtualCard = require("../models/VirtualCard");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

function generateCardNumber() {
  const prefixes = { naira: "512345", dollar: "412345" };
  const prefix = prefixes.naira;
  let num = prefix;
  for (let i = 0; i < 10; i++) num += Math.floor(Math.random() * 10);
  return num;
}

function generateExpiry() {
  const now = new Date();
  const expYear = now.getFullYear() + 3;
  const expMonth = String(now.getMonth() + 2 > 12 ? (now.getMonth() + 2) % 12 || 12 : now.getMonth() + 2).padStart(2, "0");
  return { expMonth, expYear: String(expYear).slice(-2) };
}

function generateCVV() {
  return String(Math.floor(100 + Math.random() * 900));
}

exports.createCard = async (req, res) => {
  try {
    const { cardName, cardType, initialFunding } = req.body;
    if (!cardName) return res.status(400).json({ message: "Card name required" });

    const currency = cardType === "dollar" ? "USD" : "NGN";
    const wallet = await Wallet.findOne({ user: req.user._id });
    const fundAmount = initialFunding || 0;
    if (fundAmount > 0 && (!wallet || wallet.balance < fundAmount)) return res.status(400).json({ message: "Insufficient balance for initial funding" });

    const { expMonth, expYear } = generateExpiry();
    const card = await VirtualCard.create({
      user: req.user._id, cardName, cardType: cardType || "naira", currency,
      cardNumber: generateCardNumber(), expMonth, expYear, cvv: generateCVV(),
      balance: fundAmount, expiresAt: new Date(expYear + 20, parseInt(expMonth), 1),
    });

    if (fundAmount > 0) {
      wallet.balance -= fundAmount;
      await wallet.save();
    }

    res.status(201).json({ success: true, data: card });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listCards = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;
    const cards = await VirtualCard.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: cards.length, data: cards });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCard = async (req, res) => {
  try {
    const card = await VirtualCard.findOne({ _id: req.params.id, user: req.user._id });
    if (!card) return res.status(404).json({ message: "Card not found" });
    res.json({ success: true, data: card });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.freezeCard = async (req, res) => {
  try {
    const card = await VirtualCard.findOne({ _id: req.params.id, user: req.user._id });
    if (!card) return res.status(404).json({ message: "Card not found" });
    card.status = card.status === "frozen" ? "active" : "frozen";
    card.frozenAt = card.status === "frozen" ? new Date() : null;
    await card.save();
    res.json({ success: true, data: card });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelCard = async (req, res) => {
  try {
    const card = await VirtualCard.findOne({ _id: req.params.id, user: req.user._id });
    if (!card) return res.status(404).json({ message: "Card not found" });
    const wallet = await Wallet.findOne({ user: req.user._id });
    wallet.balance += card.balance;
    card.balance = 0;
    card.status = "cancelled";
    card.cancelledAt = new Date();
    await Promise.all([card.save(), wallet.save()]);
    res.json({ success: true, message: "Card cancelled, balance refunded" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.fundCard = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: "Valid amount required" });
    const card = await VirtualCard.findOne({ _id: req.params.id, user: req.user._id });
    if (!card) return res.status(404).json({ message: "Card not found" });
    if (card.status !== "active") return res.status(400).json({ message: "Card is not active" });
    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < amount) return res.status(400).json({ message: "Insufficient balance" });
    wallet.balance -= amount;
    card.balance += amount;
    await Promise.all([card.save(), wallet.save()]);
    res.json({ success: true, data: card });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
