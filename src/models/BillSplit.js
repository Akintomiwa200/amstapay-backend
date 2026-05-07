const mongoose = require("mongoose");

const billSplitSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "paid"], default: "pending" },
    paidAt: Date,
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
  }],
  status: { type: String, enum: ["open", "settled", "cancelled"], default: "open" },
  category: { type: String },
  note: String,
  settledAt: Date,
}, { timestamps: true });

billSplitSchema.index({ creator: 1, status: 1 });
billSplitSchema.index({ "participants.user": 1 });

module.exports = mongoose.model("BillSplit", billSplitSchema);
