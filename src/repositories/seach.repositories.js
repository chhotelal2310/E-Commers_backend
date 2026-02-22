const Product = require("../models/product.model");
class searchRepo {
  async getPopularProductsUsingFilter(limit, filter) {
    return await Product.find(filter)
      .select(
        "_id productName productSlug productImage price totalAmountAfterDiscount categoryId",
      )
      .populate("categoryId", "categoryName")
      .sort({ searchCount: -1, createdAt: -1 })
      .limit(limit)
      .lean();
  }
}

module.exports = new searchRepo();
