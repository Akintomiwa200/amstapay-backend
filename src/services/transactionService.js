const mongoose = require("mongoose");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const TransactionLimit = require("../models/TransactionLimit");
const realTimeService = require("./realTimeService");
const cashbackController = require("../controllers/cashbackController");

exports.atomicTransfer = async ({ senderId, receiverId, amount, type, description, reference }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const senderWallet = await Wallet.findOne({ user: senderId }).session(session);
    if (!senderWallet || senderWallet.balance < amount) {
      throw Object.assign(new Error("Insufficient balance"), { code: "INSUFFICIENT_BALANCE" });
    }

    const receiverWallet = await Wallet.findOne({ user: receiverId }).session(session);
    if (!receiverWallet) {
      throw Object.assign(new Error("Receiver wallet not found"), { code: "RECEIVER_NOT_FOUND" });
    }

    senderWallet.balance -= amount;
    senderWallet.ledger.push({ type: "debit", amount, description: description || "Transfer" });
    await senderWallet.save({ session });

    receiverWallet.balance += amount;
    receiverWallet.ledger.push({ type: "credit", amount, description: `Received: ${description || "Transfer"}` });
    await receiverWallet.save({ session });

    const tx = await Transaction.create([{
      sender: senderId, receiver: receiverId, amount,
      type: type || "normal_transfer", status: "success",
      reference: reference || `TXN-${Date.now()}`,
      description: description || "Transfer",
    }], { session });

    await session.commitTransaction();

    realTimeService.emitTransaction(tx[0], senderId);
    realTimeService.emitTransaction(tx[0], receiverId);
    realTimeService.emitWalletUpdate(senderWallet, senderId);
    realTimeService.emitWalletUpdate(receiverWallet, receiverId);

    cashbackController.awardCashback(senderId, type, amount, tx[0]._id).catch(() => {});

    return { transaction: tx[0], senderWallet, receiverWallet };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

exports.atomicDebit = async ({ userId, amount, type, description, reference }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const wallet = await Wallet.findOne({ user: userId }).session(session);
    if (!wallet || wallet.balance < amount) {
      throw Object.assign(new Error("Insufficient balance"), { code: "INSUFFICIENT_BALANCE" });
    }

    wallet.balance -= amount;
    wallet.ledger.push({ type: "debit", amount, description });
    await wallet.save({ session });

    const tx = await Transaction.create([{
      sender: userId, amount, type, status: "success",
      reference: reference || `DEB-${Date.now()}`,
      description,
    }], { session });

    await session.commitTransaction();

    realTimeService.emitTransaction(tx[0], userId);
    realTimeService.emitWalletUpdate(wallet, userId);

    return { transaction: tx[0], wallet };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

exports.atomicCredit = async ({ userId, amount, type, description, reference }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const wallet = await Wallet.findOne({ user: userId }).session(session);
    if (!wallet) throw Object.assign(new Error("Wallet not found"), { code: "WALLET_NOT_FOUND" });

    wallet.balance += amount;
    wallet.ledger.push({ type: "credit", amount, description });
    await wallet.save({ session });

    const tx = await Transaction.create([{
      receiver: userId, amount, type, status: "success",
      reference: reference || `CR-${Date.now()}`,
      description,
    }], { session });

    await session.commitTransaction();

    realTimeService.emitTransaction(tx[0], userId);
    realTimeService.emitWalletUpdate(wallet, userId);

    return { transaction: tx[0], wallet };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

exports.checkLimits = async (userId, amount, type) => {
  const limits = await TransactionLimit.findOne({ user: userId });
  if (!limits) return true;

  const now = new Date();

  if (type === "withdraw") {
    if (limits.dailyWithdrawalReset < now) { limits.dailyWithdrawalUsed = 0; limits.dailyWithdrawalReset = new Date(now.getTime() + 86400000); }
    if (limits.dailyWithdrawalUsed + amount > limits.dailyWithdrawal) throw new Error(`Daily withdrawal limit of ₦${limits.dailyWithdrawal} exceeded`);
  }

  if (amount > limits.singleTransferMax) throw new Error(`Single transfer limit of ₦${limits.singleTransferMax} exceeded`);

  if (limits.dailyTransferReset < now) { limits.dailyTransferUsed = 0; limits.dailyTransferReset = new Date(now.getTime() + 86400000); }
  if (limits.dailyTransferUsed + amount > limits.dailyTransfer) throw new Error(`Daily transfer limit of ₦${limits.dailyTransfer} exceeded`);

  if (limits.weeklyTransferReset < now) { limits.weeklyTransferUsed = 0; limits.weeklyTransferReset = new Date(now.getTime() + 7 * 86400000); }
  if (limits.weeklyTransferUsed + amount > limits.weeklyTransfer) throw new Error(`Weekly transfer limit of ₦${limits.weeklyTransfer} exceeded`);

  limits.dailyTransferUsed += amount;
  limits.weeklyTransferUsed += amount;
  if (type === "withdraw") limits.dailyWithdrawalUsed += amount;
  await limits.save();

  return true;
};

exports.initDefaults = async (userId) => {
  const exists = await TransactionLimit.findOne({ user: userId });
  if (!exists) {
    await TransactionLimit.create({ user: userId });
  }
};
