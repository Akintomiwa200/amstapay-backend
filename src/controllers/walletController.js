const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const axios = require("axios");
const { atomicTransfer } = require("../services/transactionService");

const paystack = axios.create({
  baseURL: "https://api.paystack.co",
  headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
});

exports.getBalance = async (req, res) => {
  try {
    const userId = req.user._id;
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) wallet = await Wallet.create({ user: userId, balance: 0 });
    res.json({ balance: wallet.balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.fundWallet = async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: "Valid amount required" });

    const userId = req.user._id;
    const email = req.user.email;
    const reference = `FUND-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    let paystackResponse = null;
    try {
      const resp = await paystack.post("/transaction/initialize", {
        email, amount: amount * 100, reference,
        callback_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/wallet/fund/callback`,
      });
      paystackResponse = resp.data;
    } catch (psErr) {
      console.error("Paystack init error:", psErr.response?.data || psErr.message);
    }

    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) wallet = await Wallet.create({ user: userId, balance: 0 });

    // Do NOT credit wallet here — wait for Paystack webhook charge.success

    const txn = await Transaction.create({
      sender: userId, type: "fund", amount,
      description: description || "Wallet funded",
      status: "pending",
      reference, paystackResponse,
    });

    res.json({
      message: "Funding initiated. Wallet will be credited on payment confirmation.",
      balance: wallet.balance,
      authorization_url: paystackResponse?.data?.authorization_url,
      reference, transaction: txn,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.withdrawWallet = async (req, res) => {
  try {
    const { amount, bankCode, accountNumber, accountName, description } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: "Valid amount required" });
    if (!bankCode || !accountNumber) return res.status(400).json({ message: "Bank code and account number required" });

    const userId = req.user._id;
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < amount) return res.status(400).json({ message: "Insufficient balance" });

    const reference = `WDR-${Date.now()}`;

    let paystackSuccess = false;
    try {
      const recipientResp = await paystack.post("/transferrecipient", {
        type: "nuban", name: accountName || req.user.fullName,
        account_number: accountNumber, bank_code: bankCode, currency: "NGN",
      });

      if (recipientResp.data?.status) {
        const recipientCode = recipientResp.data.data.recipient_code;
        const transferResp = await paystack.post("/transfer", {
          source: "balance", amount: amount * 100,
          recipient: recipientCode, reason: description || "Wallet withdrawal", reference,
        });

        if (transferResp.data?.status) {
          paystackSuccess = true;
        }
      }
    } catch (psErr) {
      console.error("Paystack withdrawal error:", psErr.response?.data || psErr.message);
    }

    if (!paystackSuccess) {
      return res.status(502).json({ message: "Paystack transfer failed", balance: wallet.balance });
    }

    wallet.balance -= amount;
    await wallet.save();

    await Transaction.create({
      sender: userId, type: "withdraw", amount,
      description: description || `Withdrawal to ${accountName || accountNumber}`,
      status: "success", reference, receiverAccountNumber: accountNumber, receiverBank: bankCode,
    });

    res.json({ message: "Withdrawal successful", balance: wallet.balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.transferWallet = async (req, res) => {
  try {
    const { recipientAccountNumber, amount, description } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: "Valid amount required" });

    const senderId = req.user._id;

    const recipientUser = await User.findOne({ amstapayAccountNumber: recipientAccountNumber });
    if (!recipientUser) return res.status(404).json({ message: "Recipient not found" });

    const { transaction, senderWallet } = await atomicTransfer({
      senderId,
      receiverId: recipientUser._id,
      amount,
      type: "normal_transfer",
      description: description || `Transfer to ${recipientUser.fullName}`,
    });

    res.json({ message: "Transfer successful", balance: senderWallet.balance, transaction: transaction });
  } catch (err) {
    if (err.code === "INSUFFICIENT_BALANCE") return res.status(400).json({ message: "Insufficient balance" });
    if (err.code === "RECEIVER_NOT_FOUND") return res.status(404).json({ message: "Recipient wallet not found" });
    res.status(500).json({ message: err.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ sender: req.user._id })
      .sort({ createdAt: -1 }).populate("receiver", "fullName email amstapayAccountNumber");
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Multi-Currency Wallet ─────────────────────────────────────────────

exports.getMultiCurrencyBalances = async (req, res) => {
  try {
    const CurrencyWallet = require("../models/CurrencyWallet");
    const wallets = await CurrencyWallet.find({ user: req.user._id });
    const ngnWallet = await Wallet.findOne({ user: req.user._id });
    const result = { NGN: { balance: ngnWallet?.balance || 0 } };
    for (const w of wallets) {
      result[w.currency] = { balance: w.balance };
    }
    res.json({ currencies: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.fundCurrencyWallet = async (req, res) => {
  try {
    const CurrencyWallet = require("../models/CurrencyWallet");
    const { currency, amount } = req.body;
    if (!["USD", "EUR", "GBP"].includes(currency)) {
      return res.status(400).json({ message: "Currency must be USD, EUR, or GBP" });
    }
    if (!amount || amount <= 0) return res.status(400).json({ message: "Valid amount required" });

    const ngnWallet = await Wallet.findOne({ user: req.user._id });
    const priceOracle = require("../services/priceOracleService");
    const rate = await priceOracle.convertFiat(amount, currency, "NGN");
    const ngnCost = Math.ceil(rate * 1.02 * 100) / 100;

    if (!ngnWallet || ngnWallet.balance < ngnCost) {
      return res.status(400).json({ message: `Insufficient NGN balance. Need NGN${ngnCost}` });
    }

    ngnWallet.balance -= ngnCost;
    ngnWallet.ledger.push({ type: "debit", amount: ngnCost, description: `Convert to ${currency} wallet` });
    await ngnWallet.save();

    let cWallet = await CurrencyWallet.findOne({ user: req.user._id, currency });
    if (!cWallet) cWallet = await CurrencyWallet.create({ user: req.user._id, currency, balance: 0 });

    cWallet.balance += amount;
    cWallet.ledger.push({ type: "credit", amount, description: `Funded from NGN wallet` });
    await cWallet.save();

    await Transaction.create({
      sender: req.user._id,
      amount: ngnCost,
      type: "fund",
      status: "success",
      description: `Funded ${currency} wallet with ${amount} ${currency}`,
      originalAmount: amount,
      originalCurrency: currency,
    });

    res.json({ message: `${currency} wallet funded`, balance: cWallet.balance, ngnBalance: ngnWallet.balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.withdrawCurrencyWallet = async (req, res) => {
  try {
    const CurrencyWallet = require("../models/CurrencyWallet");
    const { currency, amount, bankDetails } = req.body;
    if (!["USD", "EUR", "GBP"].includes(currency)) {
      return res.status(400).json({ message: "Currency must be USD, EUR, or GBP" });
    }

    const cWallet = await CurrencyWallet.findOne({ user: req.user._id, currency });
    if (!cWallet || cWallet.balance < amount) {
      return res.status(400).json({ message: `Insufficient ${currency} balance` });
    }

    cWallet.balance -= amount;
    cWallet.ledger.push({ type: "debit", amount, description: `Withdrawal to ${bankDetails?.accountName || "bank account"}` });
    await cWallet.save();

    await Transaction.create({
      sender: req.user._id,
      amount,
      type: "withdraw",
      status: "pending",
      description: `Withdrew ${amount} ${currency} from ${currency} wallet`,
      originalAmount: amount,
      originalCurrency: currency,
    });

    res.json({ message: `Withdrawal initiated for ${amount} ${currency}`, balance: cWallet.balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
