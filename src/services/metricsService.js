const prometheus = {};

try {
  const client = require("prom-client");
  const collectDefaultMetrics = client.collectDefaultMetrics;
  collectDefaultMetrics({ timeout: 5000 });

  prometheus.httpRequestDuration = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  });

  prometheus.httpRequestsTotal = new client.Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status_code"],
  });

  prometheus.transactionsTotal = new client.Counter({
    name: "transactions_total",
    help: "Total number of transactions",
    labelNames: ["type", "status"],
  });

  prometheus.walletBalance = new client.Gauge({
    name: "wallet_balance_ngn",
    help: "Total wallet balance across all users",
  });

  prometheus.activeUsers = new client.Gauge({
    name: "active_users",
    help: "Number of active users",
  });

  prometheus.register = () => client.register;
  prometheus.isAvailable = true;
} catch {
  prometheus.register = () => null;
  prometheus.isAvailable = false;
  prometheus.httpRequestDuration = { observe: () => {} };
  prometheus.httpRequestsTotal = { inc: () => {} };
  prometheus.transactionsTotal = { inc: () => {} };
  prometheus.walletBalance = { set: () => {} };
  prometheus.activeUsers = { set: () => {} };
}

module.exports = prometheus;
