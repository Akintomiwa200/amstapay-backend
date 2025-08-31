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

   type: {
  type: String,
  enum: [
    "qr_payment",
    "normal_transfer",
    "airtime",
    "data",
    "cable",
    "electricity",
    "merchant_payment",
    "payment_url",
    "fund",
    "withdraw",
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
      enum: ["pending", "success", "failed"],
      default: "pending",
    },

    paystackResponse: Object, // log raw Paystack API response
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
