const cartService = require("../services/cart.service");
const { addToCartSchemaValidator } = require("../validators/cart.validator");

class CartController {
  async getCart(req, res) {
    try {
      const userId = req.user._id;
      const result = await cartService.getCart(userId);

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch cart",
        error: error.message,
      });
    }
  }

  async addToCart(req, res) {
    try {
      const validation = addToCartSchemaValidator(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
          errors: validation.errors,
        });
      }

      const userId = req.user._id;

      const { cartItems } = req.body;

      const result = await cartService.addToCart(userId, cartItems);

      if (!result.success) {
        // const statusCode = this.getStatusCode(result.code);
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to add item to cart",
        error: error.message,
      });
    }
  }

  async updateCartQuantity(req, res) {
    try {
      const userId = req.user._id;
      const { productId } = req.params;
      const { quantity } = req.body;

      if (!quantity || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be at least 1",
        });
      }

      const result = await cartService.updateCartQuantity(
        userId,
        productId,
        quantity
      );

      if (!result.success) {
        // const statusCode = this.getStatusCode(result.code);
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update cart quantity",
        error: error.message,
      });
    }
  }

  async removeFromCart(req, res) {
    try {
      const userId = req.user._id;
      const { productId } = req.params;

      const result = await cartService.removeFromCart(userId, productId);

      if (!result.success) {
        const statusCode = this.getStatusCode(result.code);
        return res.status(statusCode).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to remove item from cart",
        error: error.message,
      });
    }
  }

  async clearCart(req, res) {
    try {
      const userId = req.user._id;

      const result = await cartService.clearCart(userId);

      if (!result.success) {
        const statusCode = this.getStatusCode(result.code);
        return res.status(statusCode).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to clear cart",
        error: error.message,
      });
    }
  }

  async applyCoupon(req, res) {
    try {
      const userId = req.user._id;
      const { couponCode } = req.body;

      if (!couponCode) {
        return res.status(400).json({
          success: false,
          message: "Coupon code is required",
        });
      }

      const result = await cartService.applyCoupon(userId, couponCode);

      if (!result.success) {
        const statusCode = this.getStatusCode(result.code);
        return res.status(statusCode).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to apply coupon",
        error: error.message,
      });
    }
  }

  async removeCoupon(req, res) {
    try {
      const userId = req.user._id;

      const result = await cartService.removeCoupon(userId);

      if (!result.success) {
        const statusCode = this.getStatusCode(result.code);
        return res.status(statusCode).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to remove coupon",
        error: error.message,
      });
    }
  }

  getStatusCode(errorCode) {
    const statusMap = {
      PRODUCT_NOT_FOUND: 404,
      PRODUCT_INACTIVE: 400,
      INSUFFICIENT_STOCK: 400,
      EXCEEDS_STOCK: 400,
      INVALID_QUANTITY: 400,
      CART_NOT_FOUND: 404,
      EMPTY_CART: 400,
      INVALID_COUPON: 400,
      MINIMUM_AMOUNT_NOT_MET: 400,
    };

    return statusMap[errorCode] || 400;
  }
}

module.exports = new CartController();
