const jwt = require("jsonwebtoken");
const userRepo = require("../repositories/user.repositories");

module.exports.authMiddleware = async (req, res, next) => {
  try {
    const accessToken = req.headers.access_token;

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: "Please Login to continue!",
      });
    }

    const validateTokenUser = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );

    const user = await userRepo.findUserById(validateTokenUser?.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Access token has expired",
        code: "TOKEN_EXPIRED",
        expired: true,
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
        code: "INVALID_TOKEN",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};
