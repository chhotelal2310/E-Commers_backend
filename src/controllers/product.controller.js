const Logger = require("../utils/Logger");
const {
  addProductSchemaValidator,
} = require("../validators/product.validator");
const productService = require("../services/product.service");
const productRepo = require("../repositories/product.repositories");
module.exports.addProduct = async (req, res) => {
  const validation = addProductSchemaValidator(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: validation.message,
    });
  }

  try {
    await productRepo.addProduct({
      ...req.body,
      productImage: req.productImage,
    });
    return res.status(201).json({
      success: true,
      message: "Product Added Succefully!",
    });
  } catch (error) {
    Logger.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
module.exports.getAll = async (req, res) => {
  try {
    const allProducts = await productService.getAllGroupedByCategory();
    return res.status(200).json({
      success: true,
      message: "Retrived",
      data: allProducts,
    });
  } catch (error) {
    return res.status(500).json({
      success: true,
      message: error.message,
    });
  }
};

module.exports.getProductBySlug = async (req, res) => {
  const { productSlug } = req.params;
  try {
    const product = await productRepo.getProductBySlug(productSlug);
    return res.status(200).json({
      success: true,
      data: product,
      message: "Recieved Successfully!",
    });
  } catch (err) {
    return res.status(500).json({
      success: true,
      message: err.message,
    });
  }
};

module.exports.getSimilarProducts = async (req, res) => {
  const { productId } = req.params;
  const { categoryId } = req.query;

  try {
    const products = await productService.getSimilarProducts(
      productId,
      categoryId
    );
    return res.status(200).json({
      success: true,
      data: products,
      message: "Similar products fetched successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
