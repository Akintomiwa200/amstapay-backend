const GroupContribution = require("../models/GroupContribution");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

exports.createGroup = async (req, res) => {
  try {
    const { name, description, contributionAmount, frequency, totalCycles, memberAccountNumbers } = req.body;
    if (!name || !contributionAmount || !totalCycles) return res.status(400).json({ message: "name, contributionAmount, totalCycles required" });
    if (totalCycles < 2) return res.status(400).json({ message: "At least 2 cycles required" });

    const members = [{ user: req.user._id, role: "admin" }];
    if (memberAccountNumbers && Array.isArray(memberAccountNumbers)) {
      for (const acct of memberAccountNumbers) {
        const user = await User.findOne({ amstapayAccountNumber: acct });
        if (user && user._id.toString() !== req.user._id.toString()) {
          members.push({ user: user._id, role: "member" });
        }
      }
    }

    const payoutOrder = members.map(m => m.user);
    const group = await GroupContribution.create({
      name, description, creator: req.user._id, members,
      contributionAmount, frequency: frequency || "monthly",
      totalCycles, payoutOrder, currentPayoutIndex: 0,
      endDate: new Date(Date.now() + totalCycles * 30 * 86400000),
    });

    res.status(201).json({ message: "Contribution group created", data: group });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.contribute = async (req, res) => {
  try {
    const group = await GroupContribution.findById(req.params.id).populate("members.user", "fullName");
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.status !== "active") return res.status(400).json({ message: "Group is not active" });

    const isMember = group.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: "Not a member of this group" });

    const alreadyPaid = group.contributions.some(c => c.member.toString() === req.user._id.toString() && c.cycle === group.currentCycle);
    if (alreadyPaid) return res.status(400).json({ message: "Already contributed for this cycle" });

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < group.contributionAmount) return res.status(400).json({ message: "Insufficient balance" });

    wallet.balance -= group.contributionAmount;
    wallet.ledger.push({ type: "debit", amount: group.contributionAmount, description: `Group contribution: ${group.name} (Cycle ${group.currentCycle})` });
    await wallet.save();

    const tx = await Transaction.create({
      sender: req.user._id, amount: group.contributionAmount,
      type: "normal_transfer", status: "success", reference: `GRP-${Date.now()}`,
      description: `Group contribution: ${group.name} cycle ${group.currentCycle}`,
    });

    group.contributions.push({ member: req.user._id, amount: group.contributionAmount, cycle: group.currentCycle, transaction: tx._id });
    group.totalSaved += group.contributionAmount;

    const allContributed = group.members.every(m => {
      if (m.user._id.toString() === req.user._id.toString()) return true;
      return group.contributions.some(c => c.member.toString() === m.user._id.toString() && c.cycle === group.currentCycle);
    });

    if (allContributed) {
      const payoutMember = group.payoutOrder[group.currentPayoutIndex];
      if (payoutMember) {
        const payoutWallet = await Wallet.findOne({ user: payoutMember });
        if (payoutWallet) {
          const payoutAmount = group.contributionAmount * group.members.length;
          payoutWallet.balance += payoutAmount;
          payoutWallet.ledger.push({ type: "credit", amount: payoutAmount, description: `Group payout: ${group.name} (Cycle ${group.currentCycle})` });
          await payoutWallet.save();
        }
        await Transaction.create({
          receiver: payoutMember, amount: group.contributionAmount * group.members.length,
          type: "normal_transfer", status: "success", reference: `GP-${Date.now()}`,
          description: `Group payout: ${group.name} cycle ${group.currentCycle}`,
        });
      }
      group.currentCycle += 1;
      group.currentPayoutIndex = (group.currentPayoutIndex + 1) % group.members.length;
      if (group.currentCycle > group.totalCycles) group.status = "completed";
    }

    await group.save();
    res.json({ message: "Contribution made", data: { cycle: group.currentCycle - 1, totalSaved: group.totalSaved } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listGroups = async (req, res) => {
  try {
    const groups = await GroupContribution.find({
      $or: [{ creator: req.user._id }, { "members.user": req.user._id }],
    }).populate("members.user", "fullName email").sort({ createdAt: -1 });
    res.json({ success: true, count: groups.length, data: groups });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getGroup = async (req, res) => {
  try {
    const group = await GroupContribution.findById(req.params.id)
      .populate("members.user", "fullName email amstapayAccountNumber")
      .populate("creator", "fullName");
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
