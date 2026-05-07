const mongoose = require("mongoose");
const { getWhatsAppStatus } = require("../services/customNotificationService");
const cacheService = require("../services/cacheService");
const jobQueueService = require("../services/jobQueueService");
const prometheus = require("../services/metricsService");

exports.deepHealth = async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const health = {
    status: dbState === 1 ? "healthy" : "degraded",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: { status: dbState === 1 ? "connected" : "disconnected", state: ["disconnected", "connected", "connecting", "disconnecting"][dbState] },
    cache: { redis: cacheService.isRedisAvailable(), memory: "available" },
    queue: jobQueueService.getQueueStats(),
    whatsapp: getWhatsAppStatus(),
    memory: process.memoryUsage(),
    node: process.version,
    pid: process.pid,
    environment: process.env.NODE_ENV || "development",
  };

  const statusCode = dbState === 1 ? 200 : 503;
  res.status(statusCode).json(health);
};

exports.metrics = async (req, res) => {
  const registry = prometheus.register();
  if (registry) {
    res.setHeader("Content-Type", registry.contentType);
    const metrics = await registry.metrics();
    res.send(metrics);
  } else {
    res.json({ message: "Metrics not available (prom-client not installed)" });
  }
};
