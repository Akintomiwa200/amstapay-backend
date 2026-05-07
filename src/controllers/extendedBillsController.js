const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

const BILL_PROVIDERS = {
  school: { name: "School Fees", fee: 100 },
  transport: { name: "Transport", fee: 50 },
  internet: { name: "Internet Subscription", fee: 0 },
  exam: { name: "Exam Fees", fee: 150 },
  government: { name: "Government Payment", fee: 200 },
  betting: { name: "Betting Payment", fee: 0 },
  tax: { name: "Tax Payment", fee: 100 },
};

exports.getProviders = async (req, res) => {
  res.json({ success: true, data: Object.entries(BILL_PROVIDERS).map(([key, val]) => ({ id: key, ...val })) });
};

exports.payBill = async (req, res) => {
  try {
    const { provider, customerId, amount, metadata } = req.body;
    if (!provider || !customerId || !amount) return res.status(400).json({ message: "provider, customerId, and amount required" });

    const billConfig = BILL_PROVIDERS[provider];
    if (!billConfig) return res.status(400).json({ message: `Unknown provider: ${provider}. Supported: ${Object.keys(BILL_PROVIDERS).join(", ")}` });

    const totalAmount = amount + billConfig.fee;

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < totalAmount) return res.status(400).json({ message: `Insufficient balance. Need ₦${totalAmount}` });

    wallet.balance -= totalAmount;
    wallet.ledger.push({ type: "debit", amount: totalAmount, description: `${billConfig.name} - ${customerId}` });
    await wallet.save();

    const reference = `${provider.toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const tx = await Transaction.create({
      sender: req.user._id, amount, type: provider === "school" ? "schoolfees" : provider === "transport" ? "transport" : "bill_payment",
      status: "success", reference,
      description: `${billConfig.name} - ${customerId} (₦${amount})`,
    });

    res.json({ message: `${billConfig.name} payment successful`, data: { reference, provider, amount, fee: billConfig.fee, total: totalAmount, transaction: tx } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.merchantPayment = async (req, res) => {
  try {
    const { merchantAccountNumber, amount, description } = req.body;
    if (!merchantAccountNumber || !amount) return res.status(400).json({ message: "merchantAccountNumber and amount required" });

    const merchant = await User.findOne({ amstapayAccountNumber: merchantAccountNumber });
    if (!merchant) return res.status(404).json({ message: "Merchant not found" });
    if (merchant._id.toString() === req.user._id.toString()) return res.status(400).json({ message: "Cannot pay yourself" });

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < amount) return res.status(400).json({ message: "Insufficient balance" });

    wallet.balance -= amount;
    wallet.ledger.push({ type: "debit", amount, description: `Merchant payment to ${merchant.fullName}` });
    await wallet.save();

    const merchantWallet = await Wallet.findOne({ user: merchant._id });
    if (merchantWallet) {
      merchantWallet.balance += amount;
      merchantWallet.ledger.push({ type: "credit", amount, description: `Merchant payment from ${req.user.fullName}: ${description || "Goods/Services"}` });
      await merchantWallet.save();
    }

    const tx = await Transaction.create({
      sender: req.user._id, receiver: merchant._id, amount,
      type: "merchant_payment", status: "success", reference: `MP-${Date.now()}`,
      description: description || "Merchant payment",
    });

    res.json({ message: "Merchant payment successful", transaction: tx });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
