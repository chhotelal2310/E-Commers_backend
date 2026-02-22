const {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
} = require("../controllers/cart.controller");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = require("express").Router();

router.post("/addToCart", authMiddleware, addToCart);
router.get("/all", authMiddleware, getCart);
router.put("/updateQuantity/:productId", authMiddleware, updateCartQuantity);
router.delete("/remove/:productId", authMiddleware, removeFromCart);
router.delete("/clear", authMiddleware, clearCart);
router.post("/applyCoupon", authMiddleware, applyCoupon);
router.delete("/removeCoupon", authMiddleware, removeCoupon);

module.exports = router;
