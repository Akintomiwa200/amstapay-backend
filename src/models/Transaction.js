// models/Transaction.js
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // for AmstaPay users
    },
    receiverName: String,
    receiverAccountNumber: String,
    receiverBank: String, // e.g. "AmstaPay" or "GTBank"

    // International transfer fields
    receiverCountry: {
      type: String,
      default: "NG"
    },
    receiverCurrency: {
      type: String,
      enum: ["NGN", "USD", "EUR", "GBP", "GHS", "KES", "ZAR"],
      default: "NGN"
    },
    exchangeRate: {
      type: Number,
      default: 1
    },
    originalAmount: Number,
    originalCurrency: String,
    internationalReference: String,

    type: {
      type: String,
      enum: [
        "qr_payment",
        "normal_transfer",
        "airtime",
        "data",
        "cable",
        "electricity",
        "schoolfees",
        "transport",
        "merchant_payment",
        "payment_url",
        "fund",
        "withdraw",
        "international_transfer",
        "crypto_payment",
        "web3_deposit",
        "web3_withdrawal",
        "bill_payment"
      ],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    qrData: String, // store scanned QR JSON
    reference: { type: String, unique: true },
    merchantId: String,
    description: String,

    status: {
      type: String,
      enum: ["pending", "processing", "success", "failed", "reversed"],
      default: "pending",
    },

    paystackResponse: Object, // log raw Paystack API response

    // Web3/Crypto fields
    blockchain: String, // e.g. "ethereum", "bsc", "polygon"
    cryptoAmount: Number,
    cryptoToken: String, // e.g. "USDT", "USDC", "ETH"
    walletAddress: String,
    transactionHash: String,

    // Notification tracking
    notificationSent: {
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
