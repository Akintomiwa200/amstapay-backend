const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");
const { generateWeb3Wallet, getWeb3WalletBalance, sendCrypto, getSupportedChains } = require("../services/web3Service");
const priceOracle = require("../services/priceOracleService");

exports.generateWallet = async (req, res) => {
  try {
    const { blockchain } = req.body;
    const chain = blockchain || "ethereum";

    const result = await generateWeb3Wallet(req.user._id, chain);
    res.json({ message: `${chain} wallet generated`, address: result.address, blockchain: chain });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBalance = async (req, res) => {
  try {
    const { blockchain = "ethereum", token } = req.query;
    const result = await getWeb3WalletBalance(req.user._id, blockchain, token || null);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllBalances = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const chains = getSupportedChains();
    const results = [];
    for (const chain of chains) {
      try {
        const balance = await getWeb3WalletBalance(req.user._id, chain);
        results.push(balance);
      } catch (e) {
        results.push({ blockchain: chain, balance: 0, error: e.message });
      }
    }
    res.json({ wallets: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.send = async (req, res) => {
  try {
    const { amount, toAddress, blockchain = "ethereum", token } = req.body;
    if (!amount || !toAddress) return res.status(400).json({ error: "amount and toAddress required" });

    const result = await sendCrypto(req.user._id, toAddress, amount, blockchain, token || null);
    res.json({ message: "Transaction sent", ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deposit = async (req, res) => {
  try {
    const { amount, tokenSymbol, blockchain = "ethereum" } = req.body;
    const user = await User.findById(req.user._id);
    const wallet = user.web3Wallets?.find(w => w.blockchain === blockchain) || user.web3Wallet;
    if (!wallet) return res.status(400).json({ error: `No ${blockchain} wallet found` });

    const tx = await Transaction.create({
      sender: user._id,
      cryptoAmount: amount,
      cryptoToken: tokenSymbol || "ETH",
      blockchain,
      type: "web3_deposit",
      walletAddress: wallet.address,
      status: "pending",
      description: `Crypto deposit: ${amount} ${tokenSymbol || "ETH"} on ${blockchain}`,
    });

    res.json({
      message: "Deposit initiated",
      transaction: tx,
      walletAddress: wallet.address,
      instructions: `Send ${amount} ${tokenSymbol || "ETH"} to your ${blockchain} wallet address`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.convert = async (req, res) => {
  try {
    const { cryptoAmount, cryptoToken, toFiat = "NGN" } = req.body;
    const user = await User.findById(req.user._id);

    const rate = await priceOracle.getCryptoFiatRate(cryptoToken, toFiat);
    const fiatAmount = Math.round(cryptoAmount * rate * 100) / 100;

    const wallet = await Wallet.findOne({ user: user._id });
    if (wallet) {
      wallet.balance += fiatAmount;
      wallet.ledger.push({ type: "credit", amount: fiatAmount, description: `Converted ${cryptoAmount} ${cryptoToken} to ${toFiat}` });
      await wallet.save();
    }

    const transaction = await Transaction.create({
      sender: user._id,
      amount: fiatAmount,
      cryptoAmount,
      cryptoToken,
      type: "crypto_payment",
      status: "success",
      description: `Converted ${cryptoAmount} ${cryptoToken} to ${toFiat}${fiatAmount}`,
    });

    res.json({ message: "Conversion successful", fiatAmount, rate, transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPrice = async (req, res) => {
  try {
    const { coin, vs_currency = "USD" } = req.query;
    if (!coin) return res.status(400).json({ error: "coin query param required" });

    const price = await priceOracle.getPrice(coin, vs_currency);
    res.json({ coin: coin.toUpperCase(), vs_currency: vs_currency.toUpperCase(), price });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPrices = async (req, res) => {
  try {
    const { coins, vs_currency = "USD" } = req.query;
    const coinList = coins ? coins.split(",") : priceOracle.supportedCoins();
    const prices = await priceOracle.getPrices(coinList, vs_currency);
    res.json({ vs_currency: vs_currency.toUpperCase(), prices });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  generateWallet: exports.generateWallet,
  getBalance: exports.getBalance,
  getAllBalances: exports.getAllBalances,
  send: exports.send,
  deposit: exports.deposit,
  convert: exports.convert,
  getPrice: exports.getPrice,
  getPrices: exports.getPrices,
};
