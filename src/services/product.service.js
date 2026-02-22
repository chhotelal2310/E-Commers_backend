const productRepo = require("../repositories/product.repositories");

class ProductService {
  async getAllGroupedByCategory() {
    const products = await productRepo.getProduct();

    const groupedProducts = products.reduce((acc, product) => {
      const categoryName = product.categoryId?.categoryName || "Uncategorized";

      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }

      acc[categoryName].push({
        _id: product._id,
        productName: product.productName,
        productImage: product.productImage,
        stock: product.stock,
        price: product.price,
        discount: product.discount,
        totalAmountAfterDiscount: product.totalAmountAfterDiscount,
        productSlug: product.productSlug,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      });

      return acc;
    }, {});

    return groupedProducts;
  }

  async getAll() {
    return await productRepo.getProduct();
  }

  async getSimilarProducts(productId, categoryId, limit = 4) {
    const products = await productRepo.getProduct();
    // Filter by category and exclude current product
    const similar = products
      .filter(
        (p) =>
          p.categoryId?._id.toString() === categoryId &&
          p._id.toString() !== productId
      )
      .slice(0, limit);
    
    return similar;
  }
}

module.exports = new ProductService();
