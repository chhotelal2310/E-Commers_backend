const {
  registerUser,
  sendOtpForEmailVerification,
  verifyEmail,
  loginUser,
  uploadProfileImage,
  getMe,
  updateUserDetails,
  logout,
} = require("../controllers/user.controller");
const { authMiddleware } = require("../middleware/authMiddleware");
const { refreshToken } = require("../middleware/generateRefreshToken");
const upload = require("../middleware/multer");

const router = require("express").Router();

router.post("/register-user", registerUser);
router.post("/send-otp", sendOtpForEmailVerification);
router.post("/verify-otp", verifyEmail);
router.post("/login", loginUser);
router.post("/logout", logout);
router.post("/refresh", refreshToken);
router.post(
  "/upload-profileImage",
  upload.single("profileImage"),
  uploadProfileImage
);
router.get("/me", authMiddleware, getMe);

router.put("/update-user-details", authMiddleware, updateUserDetails);

module.exports = router;
