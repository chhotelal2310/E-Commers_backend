const Redis = require("ioredis");
const Logger = require("../utils/Logger");
const redis = new Redis(process.env.REDIS);
Logger.info("Redis Initialised...");
module.exports = redis;
