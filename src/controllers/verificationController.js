const User = require("../models/User");
const { verifyBVN, verifyNIN, verifyBankAccount } = require("../services/verificationService");

// BVN Verification
exports.verifyBVN = async (req, res) => {
  const { bvn } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const result = await verifyBVN(bvn);
  if (!result.success) return res.status(400).json({ message: result.error });

  user.bvnOrNin = bvn;
  await user.save();

  res.json({ message: "BVN verified successfully", data: result.data });
};

// NIN Verification (SmileID)
exports.verifyNIN = async (req, res) => {
  const { nin, dob } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const names = user.fullName.split(" ");
  const firstName = names[0];
  const lastName = names[names.length - 1];

  const result = await verifyNIN(nin, firstName, lastName, dob);
  if (!result.success) return res.status(400).json({ message: result.error });

  user.bvnOrNin = nin;
  await user.save();

  res.json({ message: "NIN verified successfully", data: result.data });
};

// Bank Account Verification
exports.verifyBankAccount = async (req, res) => {
  const { accountNumber, bankCode } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const result = await verifyBankAccount(accountNumber, bankCode);
  if (!result.success) return res.status(400).json({ message: result.error });

  user.accountNumber = accountNumber;
  user.bankName = result.data.bank_name;
  user.accountName = result.data.account_name;
  await user.save();

  res.json({ message: "Bank account verified successfully", data: result.data });
};
