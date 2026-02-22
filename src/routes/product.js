const {
  addProduct,
  getAll,
  getProductBySlug,
  getSimilarProducts,
} = require("../controllers/product.controller");
const { authMiddleware } = require("../middleware/authMiddleware");
const upload = require("../middleware/multer");
const uploadMulipleImages = require("../middleware/uploadMultipImagesToAws");

const router = require("express").Router();

router.post(
  "/add-product",
  authMiddleware,
  upload.array("productImages"),
  uploadMulipleImages,
  addProduct
);
router.get("/all", getAll);
router.get("/all/:productSlug", getProductBySlug);
router.get("/similar/:productId", getSimilarProducts);
module.exports = router;
