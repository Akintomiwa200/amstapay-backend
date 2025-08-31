const crypto = require("crypto");
const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;

const paystackWebhook = async (req, res) => {
  try {
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    const { event, data } = req.body;
    console.log(`📡 Paystack Webhook: ${event}`);

    const transaction = await Transaction.findOne({ reference: data.reference });
    if (!transaction) return res.sendStatus(200);

    if (event === "transfer.success") {
      transaction.status = "success";
      transaction.metadata = { ...transaction.metadata, paystackWebhook: data };
      await transaction.save();
    }

    if (event === "transfer.failed" || event === "transfer.reversed") {
      transaction.status = "failed";
      transaction.metadata = { ...transaction.metadata, paystackWebhook: data };
      await transaction.save();

      // Refund user
      const senderWallet = await Wallet.findOne({ user: transaction.sender });
      if (senderWallet) {
        senderWallet.balance += transaction.amount;
        senderWallet.ledger.push({
          type: "refund",
          amount: transaction.amount,
          transaction: transaction._id,
        });
        await senderWallet.save();
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook Error:", err.message);
    res.sendStatus(500);
  }
};

module.exports = { paystackWebhook };
