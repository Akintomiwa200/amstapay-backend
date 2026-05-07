let io = null;

exports.init = (socketIO) => {
  io = socketIO;
};

exports.emit = (event, data, userId = null) => {
  if (!io) return;
  if (userId) {
    io.to(`user:${userId}`).emit(event, {
      ...data,
      _timestamp: new Date().toISOString(),
    });
  } else {
    io.emit(event, {
      ...data,
      _timestamp: new Date().toISOString(),
    });
  }
};

exports.emitTransaction = (tx, userId) => {
  exports.emit("transaction:new", { transaction: tx }, userId);
  if (tx.status === "success") exports.emit("transaction:success", { transaction: tx }, userId);
  if (tx.status === "failed") exports.emit("transaction:failed", { transaction: tx }, userId);
};

exports.emitWalletUpdate = (wallet, userId) => {
  exports.emit("wallet:update", { balance: wallet.balance, currency: wallet.currency }, userId);
};

exports.emitNotification = (notification, userId) => {
  exports.emit("notification:new", { notification }, userId);
};

exports.emitAlert = (type, message, userId) => {
  exports.emit("alert", { type, message }, userId);
};
