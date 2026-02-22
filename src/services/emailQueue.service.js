// services/emailQueue.service.js
const Queue = require("bull");
const orderRepo = require("../repositories/order.repositories");
const Logger = require("../utils/Logger");

// Use the Redis URL directly
const emailQueue = new Queue("email-confirmation", process.env.REDIS, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 100,
  },
});

// Process emails
emailQueue.process(async (job) => {
  const { order, userId } = job.data;
  Logger.info(`Sending email for order: ${order._id}`);

  try {
    await orderRepo.handleEmailConfirmation(order, userId);
    Logger.info(`Email sent for order: ${order._id}`);
  } catch (error) {
    Logger.error(`Failed to send email: ${error.message}`);
    throw error;
  }
});

// Optional: Add event listeners
emailQueue.on("completed", (job) => {
  Logger.info(`Email job completed for order: ${job.data.order._id}`);
});

emailQueue.on("failed", (job, err) => {
  Logger.error(`Email job failed: ${err.message}`);
});

module.exports = emailQueue;
