const Bill = require('../models/Bill');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

// Airtime purchase
exports.buyAirtime = async (req, res) => {
  try {
    const { phoneNumber, network, amount } = req.body;
    const userId = req.user._id;

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });

    wallet.balance -= amount;
    await wallet.save();

    const bill = await Bill.create({
      user: userId,
      type: 'airtime',
      provider: network.toUpperCase(),
      phoneNumber,
      amount
    });

    await Transaction.create({
      user: userId,
      type: 'bill_payment',
      amount,
      description: `Airtime ${network} ₦${amount} to ${phoneNumber}`
    });

    res.json({ message: 'Airtime purchased successfully', bill });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Data bundle
exports.buyData = async (req, res) => {
  try {
    const { phoneNumber, network, plan, amount } = req.body;
    const userId = req.user._id;

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });

    wallet.balance -= amount;
    await wallet.save();

    const bill = await Bill.create({
      user: userId,
      type: 'data',
      provider: network.toUpperCase(),
      phoneNumber,
      amount,
      reference: plan
    });

    res.json({ message: 'Data bundle purchased successfully', bill });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Electricity
exports.buyElectricity = async (req, res) => {
  try {
    const { meterNumber, disco, amount, meterType } = req.body;
    const userId = req.user._id;

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });

    wallet.balance -= amount;
    await wallet.save();

    const bill = await Bill.create({
      user: userId,
      type: 'electricity',
      provider: disco,
      meterNumber,
      amount,
      meterType
    });

    res.json({ message: 'Electricity token purchased successfully', bill });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// School fees stub
exports.paySchoolFees = async (req, res) => {
  try {
    const { schoolCode, amount, studentId } = req.body;
    // similar wallet deduct + Bill create
    res.json({ message: 'School fees payment initiated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Transport stub
exports.payTransport = async (req, res) => {
  try {
    res.json({ message: 'Transport payment successful' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  buyAirtime,
  buyData,
  buyElectricity,
  paySchoolFees,
  payTransport
};

