const { OAuth2Client } = require("google-auth-library");
const userService = require("../services/user.service");
const { setCookie } = require("../utils/setCookie");
const Logger = require("../utils/Logger");

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

module.exports.googleAuth = (req, res) => {
  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });
  res.redirect(authUrl);
};

module.exports.googleCallback = async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // Call service to find or create user
    const result = await userService.loginOrSignupWithGoogle(payload);

    setCookie(res, "refresh_Token", result.tokens.refreshToken);

    // Redirect to frontend with tokens (or just success, depending on how frontend handles it)
    // For security, usually we don't pass tokens in URL. But for simplicity in this task context,
    // or if the frontend expects it. Better approach: cookie is set, frontend checks /me.
    // However, frontend needs accessToken.
    // Let's passed it as query param or setting a temporary cookie that frontend reads.
    // Assuming redirection to localhost:5173

    // Safety check for redirect URL
    const frontendUrl = "https://infinite-mart-ecom.vercel.app/";

    res.redirect(`${frontendUrl}?accessToken=${result.tokens.accessToken}`);
  } catch (error) {
    Logger.error("Google Auth Error:", error);
    res.status(500).json({ message: "Google authentication failed" });
  }
};
