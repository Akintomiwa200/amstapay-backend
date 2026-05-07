const mongoose = require("mongoose");

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  invoiceNumber: { type: String, unique: true, required: true },
  recipientName: { type: String, required: true },
  recipientEmail: String,
  recipientPhone: String,
  recipientAddress: String,
  items: [lineItemSchema],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  currency: { type: String, default: "NGN" },
  status: { type: String, enum: ["draft", "sent", "paid", "overdue", "cancelled"], default: "draft" },
  dueDate: Date,
  notes: String,
  terms: String,
  paidAt: Date,
  paymentLink: String,
  transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
  pdfPath: String,
}, { timestamps: true });

invoiceSchema.index({ user: 1, createdAt: -1 });
invoiceSchema.index({ invoiceNumber: 1 });

module.exports = mongoose.model("Invoice", invoiceSchema);
