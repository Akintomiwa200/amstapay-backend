const User = require("../models/User");
const Referral = require("../models/Referral");
const Wallet = require("../models/Wallet");
const crypto = require("crypto");

exports.generateReferralCode = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.referralCode) {
      return res.json({ referralCode: user.referralCode });
    }

    const namePart = user.fullName.replace(/[^a-zA-Z0-9]/g, "").substring(0, 4).toUpperCase();
    const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
    const referralCode = `${namePart}${rand}`;

    user.referralCode = referralCode;
    await user.save();

    res.json({ referralCode });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.applyReferralCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Referral code required" });

    const referrer = await User.findOne({ referralCode: code });
    if (!referrer) return res.status(404).json({ message: "Invalid referral code" });
    if (referrer._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot refer yourself" });
    }

    const user = await User.findById(req.user._id);
    if (user.referredBy) return res.status(400).json({ message: "Already referred by someone" });

    user.referredBy = referrer._id;
    await user.save();

    await Referral.create({
      referrer: referrer._id,
      referred: user._id,
      referralCode: code,
      reward: 0,
      status: "pending",
      metadata: {
        referredName: user.fullName,
        referredEmail: user.email,
        referredPhone: user.phoneNumber,
      },
    });

    res.json({ message: "Referral code applied successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.myReferrals = async (req, res) => {
  try {
    const referrals = await Referral.find({ referrer: req.user._id })
      .populate("referred", "fullName email createdAt")
      .sort({ createdAt: -1 });

    const totalRewards = referrals.reduce((sum, r) => sum + (r.reward || 0), 0);
    const pendingCount = referrals.filter(r => r.status === "pending").length;

    res.json({
      success: true,
      count: referrals.length,
      totalRewards,
      pendingCount,
      data: referrals,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.rewardSummary = async (req, res) => {
  try {
    const referrals = await Referral.find({ referrer: req.user._id });
    const totalRewards = referrals.reduce((sum, r) => sum + (r.reward || 0), 0);
    const paidRewards = referrals.filter(r => r.status === "paid").reduce((sum, r) => sum + (r.reward || 0), 0);
    const pendingRewards = referrals.filter(r => r.status === "pending").reduce((sum, r) => sum + (r.reward || 0), 0);

    res.json({
      success: true,
      data: {
        totalReferrals: referrals.length,
        totalRewards,
        paidRewards,
        pendingRewards,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const REFERRAL_BONUS = 500;

exports.processPendingRewards = async () => {
  try {
    const pendingReferrals = await Referral.find({ status: "pending" }).populate("referred");
    for (const ref of pendingReferrals) {
      if (ref.referred && ref.referred.isVerified) {
        ref.reward = REFERRAL_BONUS;
        ref.status = "paid";
        ref.paidAt = new Date();

        let wallet = await Wallet.findOne({ user: ref.referrer });
        if (!wallet) {
          wallet = await Wallet.create({ user: ref.referrer, balance: 0 });
        }
        wallet.balance += REFERRAL_BONUS;
        wallet.ledger.push({
          type: "credit",
          amount: REFERRAL_BONUS,
          description: `Referral bonus for referring ${ref.metadata?.referredName || "a friend"}`,
        });
        await wallet.save();
        await ref.save();
      }
    }
  } catch (err) {
    console.error("Referral reward processing error:", err.message);
  }
};
