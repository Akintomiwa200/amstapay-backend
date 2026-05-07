const PaymentLink = require("../models/PaymentLink");
const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");
const crypto = require("crypto");

exports.createLink = async (req, res) => {
  try {
    const { title, description, amount, maxPaymentCount, expiresAt, redirectUrl } = req.body;
    if (!title || !amount) return res.status(400).json({ message: "title and amount required" });
    if (amount < 100) return res.status(400).json({ message: "Minimum amount is ₦100" });

    const slug = crypto.randomBytes(6).toString("hex");
    const link = await PaymentLink.create({
      user: req.user._id, title, description, amount,
      maxPaymentCount: maxPaymentCount || 1, expiresAt, redirectUrl, slug,
    });

    res.status(201).json({
      message: "Payment link created",
      data: link,
      url: `${process.env.BASE_URL || "https://amstapay.com"}/pay/${slug}`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listLinks = async (req, res) => {
  try {
    const links = await PaymentLink.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: links.length, data: links });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLink = async (req, res) => {
  try {
    const link = await PaymentLink.findOne({ slug: req.params.slug, isActive: true });
    if (!link) return res.status(404).json({ message: "Payment link not found or inactive" });
    if (link.expiresAt && link.expiresAt < new Date()) return res.status(410).json({ message: "Payment link expired" });
    if (link.paymentCount >= link.maxPaymentCount) return res.status(410).json({ message: "Payment link max uses reached" });
    res.json({ success: true, data: { title: link.title, description: link.description, amount: link.amount } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.payLink = async (req, res) => {
  try {
    const link = await PaymentLink.findOne({ slug: req.params.slug, isActive: true });
    if (!link) return res.status(404).json({ message: "Payment link not found" });
    if (link.expiresAt && link.expiresAt < new Date()) return res.status(410).json({ message: "Payment link expired" });
    if (link.paymentCount >= link.maxPaymentCount) return res.status(410).json({ message: "Payment link max uses reached" });

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < link.amount) return res.status(400).json({ message: "Insufficient balance" });

    wallet.balance -= link.amount;
    wallet.ledger.push({ type: "debit", amount: link.amount, description: `Payment for: ${link.title}` });
    await wallet.save();

    const merchantWallet = await Wallet.findOne({ user: link.user });
    if (merchantWallet) {
      merchantWallet.balance += link.amount;
      merchantWallet.ledger.push({ type: "credit", amount: link.amount, description: `Payment received via link: ${link.title}` });
      await merchantWallet.save();
    }

    const tx = await Transaction.create({
      sender: req.user._id, receiver: link.user, amount: link.amount,
      type: "payment_url", reference: `PL-${Date.now()}`, status: "success",
      description: `Payment for: ${link.title} (${link.slug})`,
    });

    link.paymentCount += 1;
    link.totalCollected += link.amount;
    if (link.paymentCount >= link.maxPaymentCount) link.isActive = false;
    await link.save();

    res.json({ message: "Payment successful", transaction: tx, reference: tx.reference });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleLink = async (req, res) => {
  try {
    const link = await PaymentLink.findOne({ _id: req.params.id, user: req.user._id });
    if (!link) return res.status(404).json({ message: "Link not found" });
    link.isActive = !link.isActive;
    await link.save();
    res.json({ message: `Link ${link.isActive ? "activated" : "deactivated"}`, isActive: link.isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
