const crypto = require("crypto");

module.exports = (req, res, next) => {
  const requestId = req.headers["x-request-id"] || crypto.randomBytes(8).toString("hex");
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
};
