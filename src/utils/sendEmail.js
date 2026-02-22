const dotenv = require("dotenv");
const Logger = require("./Logger");

dotenv.config({ path: "../.env" });
const transporter = require("./transporter");

module.exports.sendEmail = async (to, subject, htmlContent) => {
  try {
    Logger.info(`Attempting to send email to: ${to} with subject: ${subject}`);
    Logger.info(`SMTP Config - Host: ${process.env.SMTP_HOST}, Port: ${process.env.SMTP_PORT}, Secure: ${process.env.SMTP_SECURE}`);
    const mailOptions = {
      from: process.env.SMTP_USER,
      to,
      subject,
      html: htmlContent,
    };
    await transporter.sendMail(mailOptions);
    Logger.info(`Email sent successfully to: ${to}`);
    return true;
  } catch (error) {
    Logger.error(`Error sending email to ${to}: ${error.message} - Stack: ${error.stack}`);
    return false;
  }
};
