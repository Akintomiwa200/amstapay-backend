const Beneficiary = require("../models/Beneficiary");

exports.addBeneficiary = async (req, res) => {
  try {
    const { type, name, accountNumber, bankName, bankCode, phoneNumber, email } = req.body;
    if (!type || !name || !accountNumber) return res.status(400).json({ message: "type, name, accountNumber required" });

    const existing = await Beneficiary.findOne({ user: req.user._id, accountNumber, type });
    if (existing) return res.status(400).json({ message: "Beneficiary already exists" });

    const beneficiary = await Beneficiary.create({
      user: req.user._id, type, name, accountNumber, bankName, bankCode, phoneNumber, email,
    });

    res.status(201).json({ message: "Beneficiary added", data: beneficiary });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listBeneficiaries = async (req, res) => {
  try {
    const beneficiaries = await Beneficiary.find({ user: req.user._id }).sort({ isFavorite: -1, transferCount: -1 }).lean();
    res.json({ success: true, count: beneficiaries.length, data: beneficiaries });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleFavorite = async (req, res) => {
  try {
    const b = await Beneficiary.findOne({ _id: req.params.id, user: req.user._id });
    if (!b) return res.status(404).json({ message: "Beneficiary not found" });
    b.isFavorite = !b.isFavorite;
    await b.save();
    res.json({ message: `Favorite ${b.isFavorite ? "set" : "removed"}`, isFavorite: b.isFavorite });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteBeneficiary = async (req, res) => {
  try {
    await Beneficiary.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: "Beneficiary deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.incrementTransfer = async (beneficiaryId) => {
  await Beneficiary.findByIdAndUpdate(beneficiaryId, {
    $inc: { transferCount: 1 }, lastTransferredAt: new Date(),
  });
};
