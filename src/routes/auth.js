const router = require("express").Router();
const { googleAuth, googleCallback } = require("../controllers/auth.controller");

router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

module.exports = router;
