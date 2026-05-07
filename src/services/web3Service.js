const { ethers } = require("ethers");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const axios = require("axios");

// ERC20 tokens supported
const TOKENS = {
  USDT: {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    decimals: 6,
    name: "Tether USD"
  },
  USDC: {
    address: "0xA0b86a33E6441E6A0F1DCb04221c4590E0E8a1f5",
    decimals: 6,
    name: "USD Coin"
  }
};

// Provider setup
const provider = new ethers.JsonRpcProvider(process.env.WEB3_PROVIDER_URL);

/**
 * Generate a new wallet for user
 */
exports.generateWeb3Wallet = async (userId) => {
  try {
    const wallet = ethers.Wallet.createRandom();
    
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    user.web3Wallet = {
      address: wallet.address,
      privateKey: wallet.privateKey
    };
    await user.save();

    return {
      address: wallet.address,
      mnemonic: wallet.mnemonic.phrase
    };
  } catch (error) {
    throw error;
  };
};

/**
 * Get wallet balance
 */
exports.getWeb3WalletBalance = async (address, token = "ETH") => {
  try {
    if (token === "ETH") {
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    }

    const tokenContract = new ethers.Contract(
      TOKENS[token].address,
      ["function balanceOf(address) view returns (uint256)"],
      provider
    );
    
    const balance = await tokenContract.balanceOf(address);
    return ethers.formatUnits(balance, TOKENS[token].decimals);
  } catch (error) {
    throw error;
  }
};

/**
 * Deposit crypto to wallet
 */
exports.depositCrypto = async (req, res) => {
  try {
    const { amount, token, tokenSymbol } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.web3Wallet) {
      await exports.generateWeb3Wallet(req.user._id);
    }

    // Create transaction record
    const transaction = new Transaction({
      sender: user._id,
      amount,
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
      depositInstructions: `Send ${amount} ${tokenSymbol} to your wallet address`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Withdraw crypto from wallet
 */
exports.withdrawCrypto = async (req, res) => {
  try {
    const { amount, tokenSymbol, toAddress } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.web3Wallet) {
      return res.status(400).json({ error: "No Web3 wallet found" });
    }

    // Create withdrawal transaction
    const transaction = new Transaction({
      sender: user._id,
      amount: amount * -1, // Negative for withdrawal
      cryptoAmount: amount,
      cryptoToken: tokenSymbol,
      type: "web3_withdrawal",
      walletAddress: toAddress || user.web3Wallet.address,
      status: "processing",
      description: `Crypto withdrawal: ${amount} ${tokenSymbol}`
    });

    await transaction.save();

    // In production, sign and broadcast transaction
    // For now, just mark as processing
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
exports.convertCryptoToFiat = async (req, res) => {
  try {
    const { cryptoAmount, cryptoToken } = req.body;
    const user = await User.findById(req.user._id);

    // Get current price (mock - use real API in production)
    const price = cryptoToken === "ETH" ? 3000 : (cryptoToken === "USDT" || cryptoToken === "USDC" ? 1 : 0.00067);
    const fiatAmount = cryptoAmount * price;

    // Update user's local wallet
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

    // Create transaction record
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
  generateWeb3Wallet: exports.generateWeb3Wallet,
  getWeb3WalletBalance: exports.getWeb3WalletBalance,
  depositCrypto: exports.depositCrypto,
  withdrawCrypto: exports.withdrawCrypto,
  convertCryptoToFiat: exports.convertCryptoToFiat
};