const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["fund", "withdraw", "payment_sent", "payment_received"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
    },
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // for payments sent/received
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
