const inMemoryQueue = [];
let processing = false;
let bullQueue = null;
let bullAvailable = false;

try {
  const Bull = require("bull");
  bullQueue = new Bull("amstapay-jobs", {
    redis: process.env.REDIS_URL || "redis://localhost:6379",
    defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
  });
  bullQueue.on("error", () => { bullAvailable = false; });
  bullQueue.on("ready", () => { bullAvailable = true; });
  bullAvailable = true;
} catch {
  bullAvailable = false;
}

const handlers = new Map();

exports.registerHandler = (jobType, handler) => {
  handlers.set(jobType, handler);
  if (bullAvailable && bullQueue) {
    bullQueue.process(jobType, async (job) => {
      await handler(job.data);
    });
  }
};

exports.addJob = async (jobType, data, options = {}) => {
  if (bullAvailable && bullQueue) {
    try {
      await bullQueue.add(jobType, data, {
        removeOnComplete: true,
        removeOnFail: false,
        ...options,
      });
      return;
    } catch { }
  }
  inMemoryQueue.push({ type: jobType, data, attempts: 0, maxAttempts: options.attempts || 3, createdAt: Date.now() });
  if (!processing) processInMemory();
};

const processInMemory = async () => {
  processing = true;
  while (inMemoryQueue.length > 0) {
    const job = inMemoryQueue.shift();
    const handler = handlers.get(job.type);
    if (!handler) continue;
    try {
      await handler(job.data);
    } catch (err) {
      job.attempts++;
      if (job.attempts < job.maxAttempts) {
        inMemoryQueue.push(job);
      } else {
        console.error(`Job ${job.type} failed after ${job.attempts} attempts:`, err.message);
      }
    }
  }
  processing = false;
};

exports.getQueueStats = () => ({
  pending: bullAvailable && bullQueue ? 0 : inMemoryQueue.length,
  bullAvailable,
  handlers: Array.from(handlers.keys()),
});

exports.scheduleRecurring = async (jobType, data, cronPattern) => {
  if (bullAvailable && bullQueue) {
    try {
      await bullQueue.add(jobType, data, { repeat: { cron: cronPattern } });
    } catch { }
  }
};
