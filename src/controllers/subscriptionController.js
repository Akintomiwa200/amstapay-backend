const Subscription = require("../models/Subscription");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

exports.createSubscription = async (req, res) => {
  try {
    const { provider, plan, amount, billingCycle, customerId, autoRenew } = req.body;
    if (!provider || !plan || !amount || !billingCycle) {
      return res.status(400).json({ message: "provider, plan, amount, billingCycle required" });
    }

    const nextBillingDate = new Date();
    if (billingCycle === "monthly") nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    else if (billingCycle === "yearly") nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    else if (billingCycle === "weekly") nextBillingDate.setDate(nextBillingDate.getDate() + 7);
    else if (billingCycle === "quarterly") nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);

    const sub = await Subscription.create({
      user: req.user._id, provider, plan, amount, billingCycle,
      customerId, autoRenew: autoRenew !== false, nextBillingDate,
    });

    res.status(201).json({ message: "Subscription created", data: sub });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listSubscriptions = async (req, res) => {
  try {
    const subs = await Subscription.find({ user: req.user._id }).sort({ nextBillingDate: 1 }).lean();
    res.json({ success: true, count: subs.length, data: subs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const sub = await Subscription.findOne({ _id: req.params.id, user: req.user._id });
    if (!sub) return res.status(404).json({ message: "Subscription not found" });
    sub.status = "cancelled";
    await sub.save();
    res.json({ message: "Subscription cancelled" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.processBilling = async () => {
  try {
    const due = await Subscription.find({
      status: "active", nextBillingDate: { $lte: new Date() },
    });
    for (const sub of due) {
      try {
        const wallet = await Wallet.findOne({ user: sub.user });
        if (!wallet || wallet.balance < sub.amount) {
          if (!sub.autoRenew) sub.status = "expired";
          await sub.save();
          continue;
        }
        wallet.balance -= sub.amount;
        wallet.ledger.push({ type: "debit", amount: sub.amount, description: `Subscription: ${sub.provider} - ${sub.plan}` });
        await wallet.save();

        sub.lastBilledAt = new Date();
        if (sub.billingCycle === "monthly") sub.nextBillingDate.setMonth(sub.nextBillingDate.getMonth() + 1);
        else if (sub.billingCycle === "yearly") sub.nextBillingDate.setFullYear(sub.nextBillingDate.getFullYear() + 1);
        else if (sub.billingCycle === "weekly") sub.nextBillingDate.setDate(sub.nextBillingDate.getDate() + 7);
        else if (sub.billingCycle === "quarterly") sub.nextBillingDate.setMonth(sub.nextBillingDate.getMonth() + 3);
        await sub.save();

        await Transaction.create({
          sender: sub.user, amount: sub.amount, type: "bill_payment", status: "success",
          reference: `SUB-${Date.now()}`, description: `Subscription: ${sub.provider} - ${sub.plan}`,
        });
      } catch (err) {
        console.error(`Subscription billing error ${sub._id}:`, err.message);
      }
    }
  } catch (err) {
    console.error("Process billing error:", err.message);
  }
};
