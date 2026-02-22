const {
  createOrder,
  verifyRazorpayPayment,
  orderHistory,
  getOrderUsingTrackingId,
} = require("../controllers/order.controller");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = require("express").Router();
router.post("/createOrder", authMiddleware, createOrder);
router.post("/verifyRazorpayPayment", authMiddleware, verifyRazorpayPayment);
router.get("/orderHistory", authMiddleware, orderHistory);
router.get("/trackOrder/:trackingId", authMiddleware, getOrderUsingTrackingId);
module.exports = router;
