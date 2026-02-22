const router = require("express").Router();
const userRoutes = require("./user");
const productRoutes = require("./product");
const categoryRoutes = require("./category");
const cartRoutes = require("./cart");
const orderRoute = require("./order");
const searchRoutes = require("./search");
const authRoutes = require("./auth");
router.use("/user", userRoutes);
router.use("/product", productRoutes);
router.use("/category", categoryRoutes);
router.use("/cart", cartRoutes);
router.use("/order", orderRoute);
router.use("/search", searchRoutes);
router.use("/auth", authRoutes);

module.exports = router;
