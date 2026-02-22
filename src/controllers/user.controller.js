const {
  signUpValidator,
  sendOtpValidator,
  verifyOtpValidator,
  loginValidator,
  updateUserDetailsValidator,
} = require("../validators/user.validator");
const Logger = require("../utils/Logger");
const userService = require("../services/user.service");
const { setCookie } = require("../utils/setCookie");

module.exports.registerUser = async (req, res) => {
  const validation = signUpValidator(req.body);

  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: validation.message,
    });
  }
  try {
    const user = await userService.createUser(req.body);

    return res.status(201).json({
      message: "User Registerd SuccessFully",
      user,
    });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports.sendOtpForEmailVerification = async (req, res) => {
  const validation = sendOtpValidator(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: validation.message,
    });
  }

  try {
    await userService.sendEmailOtpVerification(req.body.email);
    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message, // Extract just the message
    });
  }
};

module.exports.verifyEmail = async (req, res) => {
  const validation = verifyOtpValidator(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: validation.message,
    });
  }

  try {
    await userService.verifyEmail(req.body.email, req.body.otp);
    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message, // Extract just the message
    });
  }
};

module.exports.loginUser = async (req, res) => {
  const validation = loginValidator(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: validation.message,
    });
  }

  try {
    const user = await userService.loginUser(req.body.email, req.body.passWord);

    setCookie(res, "refresh_Token", user.tokens.refreshToken);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: user.user,
      token: user.tokens.accessToken,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message, // Extract just the message
    });
  }
};

module.exports.uploadProfileImage = async (req, res) => {
  try {
    await userService.uploadProfileImage(req);
    return res.status(200).json({
      success: true,
      message: "Profile Image Added Successfully",
    });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({
      success: false,
      message: "Something Went wrong !", // Extract just the message
    });
  }
};

module.exports.getMe = async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    Logger.error(error.message);
    return res.status(500).json({
      success: false,
      message: "Something Went wrong !", // Extract just the message
    });
  }
};

module.exports.updateUserDetails = async (req, res) => {
  const validation = updateUserDetailsValidator(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: validation.message,
    });
  }

  try {
    const updatedUser = await userService.updateUserDetails(req);

    return res.status(200).json({
      success: true,
      user: updatedUser,
      message: "User Details Updated Successfully!!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.logout = async (req, res) => {
  try {
    res.clearCookie("refresh_Token", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
    });
    
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};
