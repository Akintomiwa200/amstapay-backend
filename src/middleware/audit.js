const AuditLog = require("../models/AuditLog");

exports.logAction = (action, options = {}) => {
  return async (req, res, next) => {
    const originalSend = res.json.bind(res);
    res.json = function (body) {
      const success = res.statusCode < 400;
      if (!options.skipPaths || !options.skipPaths.includes(req.path)) {
        const auditEntry = {
          action: typeof action === "function" ? action(req) : action,
          resource: options.resource || req.baseUrl,
          resourceId: req.params.id || req.body?.reference || null,
          details: options.includeBody ? { body: req.body, query: req.query } : undefined,
          ip: req.ip || req.connection?.remoteAddress,
          userAgent: req.get("User-Agent"),
          deviceId: req.headers["x-device-id"],
          success,
          user: req.user?._id,
          metadata: options.metadata ? options.metadata(req) : undefined,
        };
        AuditLog.create(auditEntry).catch(err => console.error("Audit log error:", err.message));
      }
      return originalSend(body);
    };
    next();
  };
};

exports.getUserActions = async (req, res) => {
  try {
    const { page = 1, limit = 20, action } = req.query;
    const filter = { user: req.params.userId || req.user._id };
    if (action) filter.action = action;
    const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    const total = await AuditLog.countDocuments(filter);
    res.json({ success: true, data: logs, total, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSuspiciousActivity = async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const suspicious = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: twentyFourHoursAgo }, success: false } },
      { $group: { _id: { ip: "$ip", user: "$user", action: "$action" }, count: { $sum: 1 }, lastAttempt: { $max: "$createdAt" } } },
      { $match: { count: { $gte: 5 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ success: true, data: suspicious, period: "24h" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
