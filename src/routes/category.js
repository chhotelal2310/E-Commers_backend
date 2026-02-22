const { addCategory, getAll } = require("../controllers/category.controller");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = require("express").Router();

router.post("/add-category", authMiddleware, addCategory);
router.get("/all", getAll);

module.exports = router;
