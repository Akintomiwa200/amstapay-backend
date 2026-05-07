const Bill = require("../models/Bill");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const { payCable } = require("../services/paystackService");

const CABLE_PROVIDERS = {
  dstv: { name: "DSTV", code: "dstv" },
  gotv: { name: "GOTV", code: "gotv" },
  startimes: { name: "Startimes", code: "startimes" },
};

exports.buyCable = async (req, res) => {
  try {
    const { smartCardNumber, provider, plan, amount } = req.body;
    if (!smartCardNumber || !provider || !plan || !amount) return res.status(400).json({ message: "smartCardNumber, provider, plan, and amount required" });

    const providerInfo = CABLE_PROVIDERS[provider.toLowerCase()];
    if (!providerInfo) return res.status(400).json({ message: "Invalid provider. Use dstv, gotv, or startimes" });

    const userId = req.user._id;
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < amount) return res.status(400).json({ message: "Insufficient balance" });

    wallet.balance -= amount;
    await wallet.save();

    const reference = `CBL-${Date.now()}`;
    let paystackResult = null;
    try {
      paystackResult = await payCable(smartCardNumber, providerInfo.code, plan, reference);
    } catch (paystackErr) {
      console.error("Paystack cable error:", paystackErr.response?.data || paystackErr.message);
    }

    const bill = await Bill.create({
      user: userId, type: "cable", provider: providerInfo.name, amount,
      reference, status: "paid", metadata: { smartCardNumber, plan, paystackResult },
    });

    const transaction = await Transaction.create({
      sender: userId, type: "cable", amount,
      description: `${providerInfo.name} subscription for ${smartCardNumber}`,
      status: "success", reference,
    });

    res.json({
      success: true, message: `${providerInfo.name} subscription successful`,
      data: { bill, transaction, balance: wallet.balance },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyCableCustomer = async (req, res) => {
  try {
    const { smartCardNumber, provider } = req.body;
    if (!smartCardNumber || !provider) return res.status(400).json({ message: "smartCardNumber and provider required" });
    const providerInfo = CABLE_PROVIDERS[provider.toLowerCase()];
    if (!providerInfo) return res.status(400).json({ message: "Invalid provider" });
    res.json({ success: true, data: { smartCardNumber, provider: providerInfo.name, customerName: `${providerInfo.name} Subscriber` } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCablePlans = async (req, res) => {
  const plans = {
    dstv: [
      { code: "dstv-padi", name: "Padi", price: 2500 },
      { code: "dstv-yanga", name: "Yanga", price: 4600 },
      { code: "dstv-confam", name: "Confam", price: 6500 },
      { code: "dstv-asia", name: "Asia", price: 7200 },
      { code: "dstv-compact", name: "Compact", price: 10500 },
      { code: "dstv-compact-plus", name: "Compact Plus", price: 18500 },
      { code: "dstv-premium", name: "Premium", price: 37000 },
    ],
    gotv: [
      { code: "gotv-lite", name: "Lite", price: 1150 },
      { code: "gotv-jinja", name: "Jinja", price: 2150 },
      { code: "gotv-max", name: "Max", price: 3300 },
      { code: "gotv-supa", name: "Supa", price: 6100 },
    ],
    startimes: [
      { code: "startimes-nova", name: "Nova", price: 1100 },
      { code: "startimes-classic", name: "Classic", price: 2100 },
      { code: "startimes-smart", name: "Smart", price: 3100 },
      { code: "startimes-super", name: "Super", price: 5100 },
    ],
  };
  const { provider } = req.query;
  if (provider) return res.json({ success: true, data: plans[provider.toLowerCase()] || [] });
  res.json({ success: true, data: plans });
};
