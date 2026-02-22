require("dotenv").config();
const app = require("./src/app");
const Logger = require("./src/utils/Logger");
const PORT = process.env.PORT || 3745;

app.listen(PORT, (err) => {
  if (err) {
    Logger.error("Stuck in somewhere !!!");
  }
  Logger.info("Connected to server");
});
