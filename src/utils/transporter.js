const dotenv = require("dotenv");
dotenv.config({ path: "../.env" });
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  logger: true,
  debug: true,
  family: 4, // Force IPv4
});

module.exports = transporter;
