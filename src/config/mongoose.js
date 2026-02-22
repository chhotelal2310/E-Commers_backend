const mongoose = require("mongoose");

const Logger = require("../utils/Logger");

const MONGO_URL = process.env.MONGO_URL;

const connectMongo = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    Logger.info("Database Connected");
  } catch (error) {
    Logger.error("Something went wrong !");
    process.exit(1);
  }
};

module.exports = connectMongo;
