const { ethers } = require("ethers");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const axios = require("axios");
const crypto = require("crypto");
const priceOracle = require("./priceOracleService");

const CHAINS = {
  ethereum: {
    name: "Ethereum",
    nativeToken: "ETH",
    explorer: "https://etherscan.io",
    getProvider: () => new ethers.JsonRpcProvider(process.env.ETH_RPC_URL || "https://eth.llamarpc.com"),
  },
  bsc: {
    name: "Binance Smart Chain",
    nativeToken: "BNB",
    explorer: "https://bscscan.com",
    getProvider: () => new ethers.JsonRpcProvider(process.env.BSC_RPC_URL || "https://bsc-dataseed1.binance.org"),
  },
  polygon: {
    name: "Polygon",
    nativeToken: "MATIC",
    explorer: "https://polygonscan.com",
    getProvider: () => new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL || "https://polygon-rpc.com"),
  },
};

const ERC20_TOKENS = {
  USDT: { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
  USDC: { address: "0xA0b86a33E6441E6A0F1DCb04221c4590E0E8a1f5", decimals: 6 },
};

exports.getSupportedChains = () => Object.keys(CHAINS);

exports.generateWeb3Wallet = async (userId, blockchain = "ethereum") => {
  try {
    if (!CHAINS[blockchain]) throw new Error(`Unsupported blockchain: ${blockchain}`);

    const evmWallet = ethers.Wallet.createRandom();
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    if (!user.web3Wallets) user.web3Wallets = [];

    const existing = user.web3Wallets.find(w => w.blockchain === blockchain);
    if (existing) {
      return { address: existing.address, blockchain };
    }

    const walletEntry = {
      blockchain,
      address: evmWallet.address,
      privateKey: evmWallet.privateKey,
    };
    user.web3Wallets.push(walletEntry);

    if (blockchain === "ethereum" && !user.web3Wallet?.address) {
      user.web3Wallet = { address: evmWallet.address, privateKey: evmWallet.privateKey };
    }

    await user.save();

    return { address: evmWallet.address, blockchain, mnemonic: evmWallet.mnemonic.phrase };
  } catch (error) {
    throw error;
  }
};

exports.getWeb3WalletBalance = async (userId, blockchain = "ethereum", token = null) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const wallet = user.web3Wallets?.find(w => w.blockchain === blockchain) || user.web3Wallet;
    if (!wallet) throw new Error(`No ${blockchain} wallet found`);

    const address = wallet.address;
    const chain = CHAINS[blockchain];
    if (!chain) throw new Error(`Unsupported chain: ${blockchain}`);

    if (blockchain === "solana") {
      const { data } = await axios.get(`https://api.mainnet-beta.solana.com`, {
        method: "POST",
        data: { jsonrpc: "2.0", id: 1, method: "getBalance", params: [address] },
      });
      return { blockchain, address, balance: (data.result?.value || 0) / 1e9, token: "SOL" };
    }

    if (blockchain === "bitcoin") {
      const { data } = await axios.get(`https://blockchain.info/balance?active=${address}`);
      const balance = data[address]?.final_balance / 1e8 || 0;
      return { blockchain, address, balance, token: "BTC" };
    }

    const provider = chain.getProvider();

    if (token && ERC20_TOKENS[token]) {
      const contract = new ethers.Contract(
        ERC20_TOKENS[token].address,
        ["function balanceOf(address) view returns (uint256)"],
        provider
      );
      const bal = await contract.balanceOf(address);
      return { blockchain, address, balance: parseFloat(ethers.formatUnits(bal, ERC20_TOKENS[token].decimals)), token };
    }

    const bal = await provider.getBalance(address);
    return { blockchain, address, balance: parseFloat(ethers.formatEther(bal)), token: chain.nativeToken };
  } catch (error) {
    throw error;
  }
};

exports.sendCrypto = async (userId, toAddress, amount, blockchain = "ethereum", token = null) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const wallet = user.web3Wallets?.find(w => w.blockchain === blockchain) || user.web3Wallet;
    if (!wallet || !wallet.privateKey) throw new Error(`No private key for ${blockchain} wallet`);

    const chain = CHAINS[blockchain];
    if (!chain) throw new Error(`Unsupported chain: ${blockchain}`);

    const provider = chain.getProvider();
    const signer = new ethers.Wallet(wallet.privateKey, provider);

    let tx;
    if (token && ERC20_TOKENS[token]) {
      const tokenContract = new ethers.Contract(
        ERC20_TOKENS[token].address,
        ["function transfer(address to, uint256 amount) returns (bool)"],
        signer
      );
      const decimals = ERC20_TOKENS[token].decimals;
      tx = await tokenContract.transfer(toAddress, ethers.parseUnits(amount.toString(), decimals));
    } else {
      tx = await signer.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amount.toString()),
      });
    }

    const receipt = await tx.wait();

    const txRecord = await Transaction.create({
      sender: userId,
      blockchain,
      cryptoAmount: amount,
      cryptoToken: token || chain.nativeToken,
      type: "web3_withdrawal",
      walletAddress: toAddress,
      transactionHash: receipt.hash,
      status: "success",
      description: `Sent ${amount} ${token || chain.nativeToken} on ${blockchain}`,
    });

    return { transactionHash: receipt.hash, blockNumber: receipt.blockNumber, transaction: txRecord };
  } catch (error) {
    throw error;
  }
};

exports.convertCryptoToFiat = async (req, res) => {
  try {
    const { cryptoAmount, cryptoToken } = req.body;
    const user = await User.findById(req.user._id);

    const price = await priceOracle.getCryptoFiatRate(cryptoToken, "NGN");
    const fiatAmount = Math.round(cryptoAmount * price * 100) / 100;

    const wallet = await Wallet.findOne({ user: user._id });
    if (wallet) {
      wallet.balance += fiatAmount;
      wallet.ledger.push({
        type: "credit",
        amount: fiatAmount,
        description: `Converted ${cryptoAmount} ${cryptoToken} to NGN`,
      });
      await wallet.save();
    }

    const transaction = await Transaction.create({
      sender: user._id,
      amount: fiatAmount,
      cryptoAmount,
      cryptoToken,
      type: "crypto_payment",
      status: "success",
      description: `Converted ${cryptoAmount} ${cryptoToken} to NGN${fiatAmount}`,
    });

    res.json({
      message: "Conversion successful",
      fiatAmount,
      rate: price,
      transaction,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


