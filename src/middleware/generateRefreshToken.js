const jwt = require("jsonwebtoken");
const Logger = require("../utils/Logger");
module.exports.refreshToken = async (req, res) => {
    Logger.info(req.cookies);
    const refreshToken = req.cookies.refresh_Token;

  const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

  const newAccessToken = jwt.sign(
    { userId: decoded.userId },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  return res.json({
    accessToken: newAccessToken,
    expiresIn: 900,
  });
};
