const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

exports.bulkDisburse = async (req, res) => {
  try {
    const { payments } = req.body;
    if (!payments || !Array.isArray(payments) || payments.length === 0) return res.status(400).json({ message: "Payments array required" });
    if (payments.length > 500) return res.status(400).json({ message: "Max 500 payments per batch" });

    const userId = req.user._id;
    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < totalAmount) return res.status(400).json({ message: "Insufficient balance" });

    const results = { successful: [], failed: [], totalAmount, batchReference: `BULK-${Date.now()}` };

    for (const payment of payments) {
      const { amount, accountNumber, bankCode, name, description } = payment;
      if (!amount || !accountNumber) {
        results.failed.push({ ...payment, reason: "Missing amount or accountNumber" });
        continue;
      }
      try {
        if (wallet.balance < amount) throw new Error("Insufficient balance after previous disbursements");
        wallet.balance -= amount;
        const txn = await Transaction.create({
          sender: userId, type: "normal_transfer", amount,
          description: description || `Bulk disbursement to ${name || accountNumber}`,
          status: "success", reference: `${results.batchReference}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          receiverName: name, receiverAccountNumber: accountNumber, receiverBank: bankCode || "AmstaPay",
        });
        results.successful.push({ amount, accountNumber, name, reference: txn.reference });
      } catch (err) {
        results.failed.push({ ...payment, reason: err.message });
      }
    }

    await wallet.save();

    res.json({
      success: true, message: `Disbursed ${results.successful.length}/${payments.length} payments`,
      data: results,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.paySalary = async (req, res) => {
  try {
    const { employees } = req.body;
    if (!employees || !Array.isArray(employees) || employees.length === 0) return res.status(400).json({ message: "Employees array required" });

    const userId = req.user._id;
    const totalAmount = employees.reduce((sum, e) => sum + (e.amount || 0), 0);
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < totalAmount) return res.status(400).json({ message: "Insufficient balance" });

    const results = { successful: [], failed: [], totalAmount, payrollReference: `PAY-${Date.now()}` };

    for (const emp of employees) {
      const { employeeId, amount, note } = emp;
      if (!employeeId || !amount) {
        results.failed.push({ ...emp, reason: "Missing employeeId or amount" });
        continue;
      }
      try {
        const employee = await User.findById(employeeId);
        if (!employee) throw new Error(`Employee ${employeeId} not found`);
        const empWallet = await Wallet.findOne({ user: employeeId });
        if (!empWallet) throw new Error(`Wallet not found for employee ${employeeId}`);
        wallet.balance -= amount;
        empWallet.balance += amount;
        await empWallet.save();
        const txn = await Transaction.create({
          sender: userId, receiver: employeeId, type: "normal_transfer", amount,
          description: note || `Salary payment for ${employee.fullName}`,
          status: "success", reference: `${results.payrollReference}-${employeeId}`,
        });
        results.successful.push({ employeeId, amount, name: employee.fullName, reference: txn.reference });
      } catch (err) {
        results.failed.push({ ...emp, reason: err.message });
      }
    }

    await wallet.save();
    res.json({ success: true, message: `Paid ${results.successful.length}/${employees.length} employees`, data: results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
