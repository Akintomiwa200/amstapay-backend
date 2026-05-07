const Bill = require('../models/Bill');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { buyAirtime: paystackAirtime, buyData: paystackData, payElectricity: paystackElectricity } = require('../services/paystackService');
const { sendTransactionAlert } = require('../services/customNotificationService');
const crypto = require('crypto');

const buyAirtime = async (req, res) => {
  try {
    const { phoneNumber, network, amount } = req.body;
    if (!phoneNumber || !network || !amount) return res.status(400).json({ success: false, message: 'phoneNumber, network, and amount required' });

    const userId = req.user._id;
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < amount) return res.status(400).json({ success: false, message: 'Insufficient balance' });

    const reference = `AIR-${Date.now()}`;
    let providerResponse = null;
    try {
      providerResponse = await paystackAirtime(phoneNumber, amount, reference);
    } catch (psErr) {
      console.error("Paystack airtime error:", psErr.response?.data || psErr.message);
    }

    wallet.balance -= amount;
    await wallet.save();

    const bill = await Bill.create({
      user: userId, type: 'airtime', provider: network.toUpperCase(),
      phoneNumber, amount, reference, status: 'paid',
      metadata: { providerResponse },
    });

    const transaction = await Transaction.create({
      sender: userId, type: 'airtime', amount,
      description: `Airtime ${network} ₦${amount} to ${phoneNumber}`,
      status: 'success', reference: bill.reference,
    });

    await sendTransactionAlert({ userId, email: req.user.email, phone: req.user.phoneNumber, transaction: { type: 'airtime', amount, status: 'success', reference: bill.reference } });

    res.json({ success: true, message: 'Airtime purchased successfully', data: { bill, transaction, balance: wallet.balance } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const buyData = async (req, res) => {
  try {
    const { phoneNumber, network, dataPlanId, amount } = req.body;
    if (!phoneNumber || !network || !dataPlanId || !amount) return res.status(400).json({ success: false, message: 'phoneNumber, network, dataPlanId, and amount required' });

    const userId = req.user._id;
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < amount) return res.status(400).json({ success: false, message: 'Insufficient balance' });

    const reference = `DATA-${Date.now()}`;
    let providerResponse = null;
    try {
      providerResponse = await paystackData(phoneNumber, dataPlanId, reference);
    } catch (psErr) {
      console.error("Paystack data error:", psErr.response?.data || psErr.message);
    }

    wallet.balance -= amount;
    await wallet.save();

    const bill = await Bill.create({
      user: userId, type: 'data', provider: network.toUpperCase(),
      phoneNumber, amount, reference, status: 'paid',
      metadata: { dataPlanId, providerResponse },
    });

    const transaction = await Transaction.create({
      sender: userId, type: 'data', amount,
      description: `Data plan for ${phoneNumber}`,
      status: 'success', reference: bill.reference,
    });

    await sendTransactionAlert({ userId, email: req.user.email, phone: req.user.phoneNumber, transaction: { type: 'data', amount, status: 'success', reference: bill.reference } });

    res.json({ success: true, message: 'Data plan purchased successfully', data: { bill, transaction, balance: wallet.balance } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const buyElectricity = async (req, res) => {
  try {
    const { meterNumber, provider, amount, meterType = "PREPAID" } = req.body;
    if (!meterNumber || !provider || !amount) return res.status(400).json({ success: false, message: 'meterNumber, provider, and amount required' });

    const userId = req.user._id;
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < amount) return res.status(400).json({ success: false, message: 'Insufficient balance' });

    const reference = `ELEC-${Date.now()}`;
    let providerResponse = null;
    try {
      providerResponse = await paystackElectricity(meterNumber, provider, amount, reference);
    } catch (psErr) {
      console.error("Paystack electricity error:", psErr.response?.data || psErr.message);
    }

    wallet.balance -= amount;
    await wallet.save();

    const token = providerResponse?.data?.token || generateToken(meterNumber, amount);

    const bill = await Bill.create({
      user: userId, type: 'electricity', provider: provider.toUpperCase(),
      meterNumber, amount, meterType, reference, status: 'paid',
      metadata: { token, providerResponse },
    });

    const transaction = await Transaction.create({
      sender: userId, type: 'electricity', amount,
      description: `Electricity bill for ${meterNumber}`,
      status: 'success', reference: bill.reference,
    });

    await sendTransactionAlert({ userId, email: req.user.email, phone: req.user.phoneNumber, transaction: { type: 'electricity', amount, status: 'success', reference: bill.reference } });

    res.json({ success: true, message: 'Electricity bill paid successfully', data: { bill, transaction, balance: wallet.balance, token } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

function generateToken(meterNumber, amount) {
  const raw = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
}

const paySchoolFees = async (req, res) => {
  try {
    const { studentId, schoolName, amount, session, term } = req.body;
    if (!studentId || !schoolName || !amount) return res.status(400).json({ success: false, message: 'studentId, schoolName, and amount required' });

    const userId = req.user._id;
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < amount) return res.status(400).json({ success: false, message: 'Insufficient balance' });

    wallet.balance -= amount;
    await wallet.save();

    const receiptNumber = `RCP-${Date.now()}`;
    const bill = await Bill.create({
      user: userId, type: 'schoolfees', provider: schoolName, amount,
      reference: receiptNumber, status: 'paid',
      metadata: { studentId, session, term },
    });

    const transaction = await Transaction.create({
      sender: userId, type: 'schoolfees', amount,
      description: `School fees to ${schoolName} (${studentId})`,
      status: 'success', reference: bill.reference,
    });

    await sendTransactionAlert({ userId, email: req.user.email, phone: req.user.phoneNumber, transaction: { type: 'schoolfees', amount, status: 'success', reference: bill.reference } });

    res.json({ success: true, message: 'School fees paid successfully', data: { bill, transaction, balance: wallet.balance, receiptNumber } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const payTransport = async (req, res) => {
  try {
    const { amount, transportType, route, bookingReference } = req.body;
    if (!amount || !transportType) return res.status(400).json({ success: false, message: 'Amount and transportType required' });

    const valid = ['BUS', 'TRAIN', 'TAXI', 'RIDE_SHARE', 'FLIGHT'];
    if (!valid.includes(transportType.toUpperCase())) return res.status(400).json({ success: false, message: `Invalid type. Use: ${valid.join(', ')}` });

    const userId = req.user._id;
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < amount) return res.status(400).json({ success: false, message: 'Insufficient balance' });

    wallet.balance -= amount;
    await wallet.save();

    const ticketNumber = `TKT-${Date.now()}`;
    const bill = await Bill.create({
      user: userId, type: 'transport', provider: transportType.toUpperCase(), amount,
      reference: bookingReference || ticketNumber, status: 'paid',
      metadata: { route, transportType: transportType.toUpperCase() },
    });

    const transaction = await Transaction.create({
      sender: userId, type: 'transport', amount,
      description: `Transport - ${transportType}${route ? ` (${route})` : ''}`,
      status: 'success', reference: bill.reference,
    });

    await sendTransactionAlert({ userId, email: req.user.email, phone: req.user.phoneNumber, transaction: { type: 'transport', amount, status: 'success', reference: bill.reference } });

    res.json({ success: true, message: 'Transport payment successful', data: { bill, transaction, balance: wallet.balance, ticketNumber } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { buyAirtime, buyData, buyElectricity, paySchoolFees, payTransport };
