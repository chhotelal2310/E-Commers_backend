const Product = require("../models/product.model");
class productRepo {
  async addProduct(data) {
    const newProduct = await Product.create(data);
    return await newProduct.save();
  }
  async getProduct() {
    return await Product.find()
      .select("-productDescription")
      .populate("categoryId", "categoryName");
  }
  async getProductByProductId(productId) {
    return await Product.findById(productId);
  }
  async getProductBySlug(productSlug) {
    return await Product.findOne({ productSlug });
  }
  async updateProductQuantity(productSummary) {
    try {
      const bulkOperations = productSummary.map((item) => ({
        updateOne: {
          filter: { _id: item.productId },
          update: {
            $inc: { stock: -item.quantity },
          },
        },
      }));

      const result = await Product.bulkWrite(bulkOperations);
   
      return result;
    } catch (error) {
      throw error;
    }
  }

  async checkProductStock(productId, requestedQuantity) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        return {
          available: false,
          availableStock: 0,
          message: "Product not found",
        };
      }

      return {
        available: product.stock >= requestedQuantity,
        availableStock: product.stock,
        message:
          product.stock >= requestedQuantity
            ? "Sufficient stock"
            : "Insufficient stock",
      };
    } catch (error) {
      return {
        available: false,
        availableStock: 0,
        message: error.message,
      };
    }
  }
}

module.exports = new productRepo();
