const prometheus = require("../services/metricsService");

module.exports = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || "unknown";
    prometheus.httpRequestDuration.observe({ method: req.method, route, status_code: res.statusCode }, duration);
    prometheus.httpRequestsTotal.inc({ method: req.method, route, status_code: res.statusCode });
  });
  next();
};
