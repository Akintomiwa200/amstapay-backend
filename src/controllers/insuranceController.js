const Insurance = require("../models/Insurance");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const crypto = require("crypto");

const PREMIUM_RATES = {
  life: { rate: 0.02, min: 5000 },
  health: { rate: 0.035, min: 3000 },
  travel: { rate: 0.015, min: 2000 },
  gadget: { rate: 0.04, min: 1000 },
};

exports.purchaseInsurance = async (req, res) => {
  try {
    const { insuranceType, coverageAmount, premiumFrequency, beneficiaries, metadata } = req.body;
    const userId = req.user._id;

    const validTypes = ["life", "health", "travel", "gadget"];
    if (!validTypes.includes(insuranceType)) {
      return res.status(400).json({ message: `Invalid type. Must be: ${validTypes.join(", ")}` });
    }

    const pricing = PREMIUM_RATES[insuranceType];
    if (coverageAmount < pricing.min) {
      return res.status(400).json({ message: `Minimum coverage for ${insuranceType} is ${pricing.min}` });
    }

    const premium = Math.round(coverageAmount * pricing.rate * 100) / 100;

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < premium) {
      return res.status(400).json({ message: "Insufficient wallet balance for premium" });
    }

    const durationMonths = premiumFrequency === "yearly" ? 12 : premiumFrequency === "quarterly" ? 3 : 1;
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    const policyNumber = `POL-${insuranceType.toUpperCase()}-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

    wallet.balance -= premium;
    wallet.ledger.push({ type: "debit", amount: premium, description: `Insurance premium for ${insuranceType} policy ${policyNumber}` });
    await wallet.save();

    const insurance = await Insurance.create({
      user: userId,
      insuranceType,
      coverageAmount,
      premium,
      premiumFrequency: premiumFrequency || "monthly",
      startDate,
      endDate,
      status: "active",
      beneficiaries,
      metadata,
      policyNumber,
    });

    await Transaction.create({
      sender: userId,
      type: "bill_payment",
      amount: premium,
      description: `Insurance premium - ${insuranceType} (${policyNumber})`,
      status: "success",
      reference: `INS-${Date.now()}`,
    });

    res.status(201).json({
      message: "Insurance policy purchased successfully",
      data: {
        policyNumber,
        insuranceType,
        coverageAmount,
        premium,
        startDate,
        endDate,
        status: "active",
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listMyPolicies = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const policies = await Insurance.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: policies.length, data: policies });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPolicy = async (req, res) => {
  try {
    const policy = await Insurance.findById(req.params.id);
    if (!policy) return res.status(404).json({ message: "Policy not found" });
    if (policy.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    res.json({ success: true, data: policy });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.fileClaim = async (req, res) => {
  try {
    const { description, amount, documents } = req.body;
    const policy = await Insurance.findById(req.params.id);
    if (!policy) return res.status(404).json({ message: "Policy not found" });
    if (policy.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (policy.status !== "active") {
      return res.status(400).json({ message: `Policy is ${policy.status}. Cannot file claim.` });
    }
    if (amount > policy.coverageAmount) {
      return res.status(400).json({ message: `Claim amount exceeds coverage of ${policy.coverageAmount}` });
    }

    policy.claims.push({ description, amount, documents: documents || [] });
    policy.status = "claimed";
    await policy.save();

    res.json({ message: "Claim filed successfully", claim: policy.claims[policy.claims.length - 1] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelPolicy = async (req, res) => {
  try {
    const policy = await Insurance.findById(req.params.id);
    if (!policy) return res.status(404).json({ message: "Policy not found" });
    if (policy.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (policy.status !== "active") {
      return res.status(400).json({ message: `Policy is already ${policy.status}` });
    }

    const refund = Math.round(policy.premium * 0.3 * 100) / 100;
    const wallet = await Wallet.findOne({ user: req.user._id });
    if (wallet) {
      wallet.balance += refund;
      wallet.ledger.push({ type: "credit", amount: refund, description: `Insurance cancellation refund for ${policy.policyNumber}` });
      await wallet.save();
    }

    policy.status = "cancelled";
    await policy.save();

    res.json({ message: "Policy cancelled", refund });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
