const Cart = require("../models/cart.model");
const Product = require("../models/product.model");

class CartRepository {
  async findCartByUserId(userId) {
    return await Cart.findOne({ user: userId });
  }

  async createCart(userId) {
    return await Cart.create({
      user: userId,
      items: [],
      shippingCharge: 99,
      taxAmount: 0,
      discountAmount: 0,
    });
  }

  async findCartById(cartId) {
    return await Cart.findById(cartId);
  }

  async addItemToCart(userId, productId, quantity, price, options = {}) {
    const cart = await Cart.findOneAndUpdate(
      { user: userId },
      {
        $push: {
          items: {
            product: productId,
            quantity,
            priceAtTimeOfAddition: price,
            selectedSize: options.size || null,
            selectedColor: options.color || null,
          },
        },
      },
      { new: true, upsert: true }
    );
    return cart;
  }

  async updateCartItemQuantity(userId, productId, quantity) {
    const cart = await Cart.findOneAndUpdate(
      {
        user: userId,
        "items.product": productId,
      },
      {
        $set: {
          "items.$.quantity": quantity,
          "items.$.updatedAt": new Date(),
        },
      },
      { new: true }
    );
    return cart;
  }

  async removeItemFromCart(userId, productId) {
    const cart = await Cart.findOneAndUpdate(
      { user: userId },
      {
        $pull: {
          items: { product: productId },
        },
      },
      { new: true }
    );
    return cart;
  }

  async clearCart(userId) {
    const cart = await Cart.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          items: [],
          couponCode: null,
          discountAmount: 0,
        },
      },
      { new: true }
    );
    return cart;
  }

  async applyCoupon(userId, couponCode, discountAmount, shippingCharge = null) {
    const updateData = {
      couponCode,
      discountAmount,
    };

    if (shippingCharge !== null) {
      updateData.shippingCharge = shippingCharge;
    }

    const cart = await Cart.findOneAndUpdate(
      { user: userId },
      { $set: updateData },
      { new: true }
    );
    return cart;
  }

  async removeCoupon(userId) {
    const cart = await Cart.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          couponCode: null,
          discountAmount: 0,
          shippingCharge: 99,
        },
      },
      { new: true }
    );
    return cart;
  }

  async getCartWithProducts(userId) {
    return await Cart.findOne({ user: userId })
      .populate({
        path: "items.product",
      })
      .lean();
  }

  async saveCart(cart) {
    return await cart.save();
  }

  async isProductInCart(userId, productId) {
    const cart = await Cart.findOne({
      user: userId,
      "items.product": productId,
    });
    return !!cart;
  }

  async getCartItem(userId, productId) {
    const cart = await Cart.findOne({
      user: userId,
      "items.product": productId,
    });

    if (!cart) return null;

    return cart.items.find((item) => item.product.toString() === productId);
  }
}

module.exports = new CartRepository();
