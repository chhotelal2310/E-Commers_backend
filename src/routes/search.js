const express = require("express");
const {
  autocompleteProducts,
  getTrendingSearches,
  searchProducts,
} = require("../controllers/search.controller");
const router = express.Router();

router.get("/", searchProducts);
router.get("/suggest", autocompleteProducts);
router.get("/trending", getTrendingSearches);
module.exports = router;
