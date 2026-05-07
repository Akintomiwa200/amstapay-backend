const Invoice = require("../models/Invoice");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

exports.createInvoice = async (req, res) => {
  try {
    const { recipientName, recipientEmail, recipientPhone, items, taxRate, discount, dueDate, notes, terms } = req.body;
    if (!recipientName || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "recipientName and items array required" });
    }

    const lineItems = items.map(i => ({
      description: i.description, quantity: i.quantity || 1,
      unitPrice: i.unitPrice, total: (i.quantity || 1) * i.unitPrice,
    }));

    const subtotal = lineItems.reduce((s, i) => s + i.total, 0);
    const tax = Math.round(subtotal * (taxRate || 0) / 100 * 100) / 100;
    const discountAmount = discount || 0;
    const total = Math.round((subtotal + tax - discountAmount) * 100) / 100;

    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const invoice = await Invoice.create({
      user: req.user._id, invoiceNumber, recipientName, recipientEmail, recipientPhone,
      items: lineItems, subtotal, tax: tax, taxRate: taxRate || 0,
      discount: discountAmount, total, dueDate, notes, terms, status: "draft",
    });

    res.status(201).json({ message: "Invoice created", data: invoice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id).lean();
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.user.toString() !== req.user._id.toString() && invoice._id.toString() !== id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    invoice.status = "sent";
    await invoice.save();
    res.json({ message: "Invoice marked as sent" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.payInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.status === "paid") return res.status(400).json({ message: "Invoice already paid" });

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < invoice.total) return res.status(400).json({ message: "Insufficient balance" });

    wallet.balance -= invoice.total;
    wallet.ledger.push({ type: "debit", amount: invoice.total, description: `Invoice payment: ${invoice.invoiceNumber}` });
    await wallet.save();

    const merchantWallet = await Wallet.findOne({ user: invoice.user });
    if (merchantWallet) {
      merchantWallet.balance += invoice.total;
      merchantWallet.ledger.push({ type: "credit", amount: invoice.total, description: `Invoice paid: ${invoice.invoiceNumber}` });
      await merchantWallet.save();
    }

    const tx = await Transaction.create({
      sender: req.user._id, receiver: invoice.user, amount: invoice.total,
      type: "normal_transfer", status: "success", reference: `INV-${Date.now()}`,
      description: `Invoice payment: ${invoice.invoiceNumber}`,
    });

    invoice.status = "paid";
    invoice.paidAt = new Date();
    invoice.transaction = tx._id;
    await invoice.save();

    res.json({ message: "Invoice paid", transaction: tx });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
