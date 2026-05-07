const { ethers } = require("ethers");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");
const { getWeb3WalletBalance, generateWeb3Wallet } = require("../services/web3Service");

/**
 * @swagger
 * tags:
 *   name: Web3
 *   description: Web3 and cryptocurrency payments
 */

/**
 * Generate Web3 wallet for user
 */
exports.generateWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.web3Wallet?.address) {
      return res.json({
        message: "Wallet already exists",
        address: user.web3Wallet.address
      });
    }

    const walletData = await generateWeb3Wallet(req.user._id);

    res.json({
      message: "Wallet generated successfully",
      address: walletData.address,
      mnemonic: walletData.mnemonic
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get Web3 wallet balance
 */
exports.getBalance = async (req, res) => {
  try {
    const { token = "ETH" } = req.query;
    const user = await User.findById(req.user._id);

    if (!user.web3Wallet) {
      return res.status(400).json({ error: "No Web3 wallet found" });
    }

    const balance = await getWeb3WalletBalance(user.web3Wallet.address, token);

    res.json({
      address: user.web3Wallet.address,
      token,
      balance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Deposit crypto
 */
exports.deposit = async (req, res) => {
  try {
    const { amount, tokenSymbol } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.web3Wallet) {
      return res.status(400).json({ error: "No Web3 wallet found" });
    }

    const transaction = new Transaction({
      sender: user._id,
      amount: 0,
      cryptoAmount: amount,
      cryptoToken: tokenSymbol,
      type: "web3_deposit",
      walletAddress: user.web3Wallet.address,
      status: "pending",
      description: `Crypto deposit: ${amount} ${tokenSymbol}`
    });

    await transaction.save();

    res.json({
      message: "Deposit initiated",
      transaction,
      walletAddress: user.web3Wallet.address,
      instructions: `Send ${amount} ${tokenSymbol} to your wallet address`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Withdraw crypto
 */
exports.withdraw = async (req, res) => {
  try {
    const { amount, tokenSymbol, toAddress } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.web3Wallet) {
      return res.status(400).json({ error: "No Web3 wallet found" });
    }

    const transaction = new Transaction({
      sender: user._id,
      amount: 0,
      cryptoAmount: amount,
      cryptoToken: tokenSymbol,
      type: "web3_withdrawal",
      walletAddress: toAddress || user.web3Wallet.address,
      status: "processing",
      description: `Crypto withdrawal: ${amount} ${tokenSymbol}`
    });

    await transaction.save();

    transaction.status = "pending";
    transaction.transactionHash = "0x" + require("crypto").randomBytes(32).toString("hex");
    await transaction.save();

    res.json({
      message: "Withdrawal initiated",
      transaction
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Convert crypto to fiat
 */
exports.convert = async (req, res) => {
  try {
    const { cryptoAmount, cryptoToken } = req.body;
    const user = await User.findById(req.user._id);

    const price = cryptoToken === "ETH" ? 3000 : (cryptoToken === "USDT" || cryptoToken === "USDC" ? 1 : 0);
    const fiatAmount = cryptoAmount * price;

    const wallet = await Wallet.findOne({ user: user._id });
    if (wallet) {
      wallet.balance += fiatAmount;
      wallet.ledger.push({
        type: "credit",
        amount: fiatAmount,
        description: `Converted ${cryptoAmount} ${cryptoToken} to NGN`
      });
      await wallet.save();
    }

    const transaction = new Transaction({
      sender: user._id,
      amount: fiatAmount,
      cryptoAmount,
      cryptoToken,
      type: "crypto_payment",
      status: "success",
      description: `Converted ${cryptoAmount} ${cryptoToken} to ₦${fiatAmount}`
    });

    await transaction.save();

    res.json({
      message: "Conversion successful",
      fiatAmount,
      transaction
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  generateWallet: exports.generateWallet,
  getBalance: exports.getBalance,
  deposit: exports.deposit,
  withdraw: exports.withdraw,
  convert: exports.convert
};