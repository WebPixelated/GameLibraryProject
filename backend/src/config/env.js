const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

// Check env parameters
const requiredEnvVars = ["JWT_SECRET", "DB_NAME"];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Missing required env variable: ${varName}`);
    process.exit(1);
  }
});

module.exports = process.env;
