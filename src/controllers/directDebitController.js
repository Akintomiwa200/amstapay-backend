const DirectDebitMandate = require("../models/DirectDebitMandate");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const crypto = require("crypto");

exports.createMandate = async (req, res) => {
  try {
    const { merchantName, maxAmount, frequency, startDate, endDate } = req.body;
    if (!merchantName || !maxAmount || !frequency) return res.status(400).json({ message: "merchantName, maxAmount, frequency required" });

    const mandateCode = `MD-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const nextDate = new Date(startDate || Date.now());

    const mandate = await DirectDebitMandate.create({
      user: req.user._id, mandateCode, merchantName, maxAmount, frequency,
      startDate: nextDate, endDate, nextPaymentDate: nextDate, status: "active",
    });

    res.status(201).json({ message: "Direct debit mandate created", data: mandate });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listMandates = async (req, res) => {
  try {
    const mandates = await DirectDebitMandate.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: mandates.length, data: mandates });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelMandate = async (req, res) => {
  try {
    const mandate = await DirectDebitMandate.findOne({ _id: req.params.id, user: req.user._id });
    if (!mandate) return res.status(404).json({ message: "Mandate not found" });
    mandate.status = "cancelled";
    await mandate.save();
    res.json({ message: "Mandate cancelled" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.processMandates = async () => {
  try {
    const due = await DirectDebitMandate.find({
      status: "active", nextPaymentDate: { $lte: new Date() },
    });
    for (const mandate of due) {
      try {
        const wallet = await Wallet.findOne({ user: mandate.user });
        if (!wallet || wallet.balance < mandate.maxAmount) {
          mandate.status = "failed";
          await mandate.save();
          continue;
        }
        wallet.balance -= mandate.maxAmount;
        wallet.ledger.push({ type: "debit", amount: mandate.maxAmount, description: `Direct debit: ${mandate.merchantName}` });
        await wallet.save();

        const ref = `DD-${mandate.mandateCode}-${Date.now()}`;
        mandate.paymentHistory.push({ amount: mandate.maxAmount, status: "success", reference: ref });
        mandate.nextPaymentDate = calculateNextDate(mandate);
        await mandate.save();

        await Transaction.create({
          sender: mandate.user, amount: mandate.maxAmount, type: "bill_payment",
          status: "success", reference: ref,
          description: `Direct debit: ${mandate.merchantName} (${mandate.mandateCode})`,
        });
      } catch (err) {
        console.error(`Mandate ${mandate.mandateCode} error:`, err.message);
      }
    }
  } catch (err) {
    console.error("Process mandates error:", err.message);
  }
};

function calculateNextDate(mandate) {
  const d = new Date(mandate.nextPaymentDate);
  if (mandate.frequency === "monthly") d.setMonth(d.getMonth() + 1);
  else if (mandate.frequency === "weekly") d.setDate(d.getDate() + 7);
  else if (mandate.frequency === "daily") d.setDate(d.getDate() + 1);
  else if (mandate.frequency === "quarterly") d.setMonth(d.getMonth() + 3);
  else if (mandate.frequency === "yearly") d.setFullYear(d.getFullYear() + 1);
  return d;
}
