const redis = require("../config/redis");
const crypto = require("crypto");

const emailRenderer = require("./emailRenderer");
const { sendEmail } = require("./sendEmail");

module.exports.trackOtpRequests = async (email) => {
  const otpRequestKey = `otp_requests_count:${email}`;
  let otpRequests = parseInt(await redis.get(otpRequestKey)) || "0";
  if (otpRequests >= 5) {
    await redis.set(`otp_span_lock:${email}`, "true", "EX", 3600);
    throw new Error("OTP requests limit reached. Please try again later.");
  }

  await redis.set(otpRequestKey, (otpRequests + 1).toString(), "EX", 3600);
};

module.exports.checkOtpRestriction = async (email, next) => {
  if (await redis.get(`otp_lock:${email}`)) {
    throw new Error("Too many OTP requests. Please try again later.");
  }
  if (await redis.get(`otp_span_lock:${email}`)) {
    throw new Error("OTP requests limit reached. Please try again later.");
  }
  if (await redis.get(`otp_cooldown:${email}`)) {
    throw new Error("Please wait before requesting another OTP.");
  }
};

module.exports.sendOtp = async (email) => {
  try {
    //it will generate 4 digit otp
    const otp = crypto.randomInt(1000, 9999).toString();

    const htmlContent = emailRenderer.render("verification", { otp });

    // Send email
    const isSent = await sendEmail(
      email,
      "Verify Your Email",
      htmlContent,
      `Your verification code is: ${otp}\n\nThis code is valid for 5 minutes.\n\nDo not share this code with anyone.`
    );

    if (!isSent) {
      throw new Error("Email sending failed");
    }

    await redis.set(`otp:${email}`, otp, "EX", 300);
    await redis.set(`otp_cooldown:${email}`, "true", "EX", 60);
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw new Error("Failed to send OTP email. Please try again later.");
  }
};

module.exports.verifyOtp = async (email, otp) => {
  const storedOtp = await redis.get(`otp:${email}`);
  if (!storedOtp) {
    throw new Error("Invalid or expired OTP ");
  }

  const faliedAttemptsKey = `otp_attempts:${email}`;
  const faieldAttempts = parseInt(await redis.get(faliedAttemptsKey)) || 0;

  if (storedOtp !== otp) {
    if (faieldAttempts >= 5) {
      await redis.set(`otp_lock:${email}`, "true", "EX", 1800);
      await redis.del(`otp:${email}`, faliedAttemptsKey);
      throw new Error(
        "Too many failed attempts. Your Account is locked for 30 minutes."
      );
    }
    await redis.set(faliedAttemptsKey, faieldAttempts + 1, "EX", 300);
    throw new Error(`Incorrect OTP . ${5 - faieldAttempts} attempts left.`);
  }
  await redis.setex(`verified_email:${email}`, 3600, "true");

  await redis.del(`otp:${email}`, faliedAttemptsKey);
};

module.exports.isEmailVerified = async (email) => {
  const verified = await redis.get(`verified_email:${email}`);

  return verified === "true";
};
module.exports.cleanup = async (email) => {
  await redis.del(`verified:${email}`, `otp:${email}`);
};
