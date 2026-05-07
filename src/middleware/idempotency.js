const IdempotencyKey = require("../models/IdempotencyKey");
const crypto = require("crypto");

exports.idempotent = (req, res, next) => {
  const key = req.headers["idempotency-key"] || req.headers["Idempotency-Key"];
  if (!key) return next();

  const handler = async () => {
    const existing = await IdempotencyKey.findOne({ key });
    if (existing) {
      return res.status(existing.statusCode || 200).json(existing.response);
    }

    const originalJson = res.json.bind(res);
    res.json = async function (body) {
      await IdempotencyKey.create({
        key,
        user: req.user?._id,
        response: body,
        statusCode: res.statusCode,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }).catch(() => {});
      return originalJson(body);
    };

    next();
  };

  handler().catch(next);
};

exports.generateKey = () => crypto.randomBytes(16).toString("hex");
