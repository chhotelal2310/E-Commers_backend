const cartRepository = require("../repositories/cart.repositories");
const productRepository = require("../repositories/product.repositories");

class CartService {
  async getCart(userId) {
    try {
      let cart = await cartRepository.getCartWithProducts(userId);

      if (!cart) {
        cart = await cartRepository.createCart(userId);
        return this.formatCartResponse(cart);
      }

      return {
        cartItems: this.formatCartItemsResponse(cart.items),
        loading: false,
        error: null,
      };
    } catch (error) {
      return {
        cartItems: [],
        loading: false,
        error: error.message,
      };
    }
  }

  formatCartItemsResponse(items) {
    return items.map((item) => {
      const product = item.product;

      return {
        _id: product._id,
        productName: product.name || product.productName,
        categoryId:
          product.category?._id || product.category || product.categoryId,
        productImage: product.images || product.productImage,
        stock: product.stock,
        price: product.price,
        discount: product.discount || 0,
        productDescription: product.description || product.productDescription,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        totalAmountAfterDiscount:
          product.totalAmountAfterDiscount ||
          product.price * (1 - (product.discount || 0) / 100),
        productSlug: product.slug || product.productSlug,
        __v: product.__v || 0,
        quantity: item.quantity,
        selectedSize: item.selectedSize || null,
        selectedColor: item.selectedColor || null,
      };
    });
  }

  async addToCart(userId, cartItems) {
    try {
      let cart = await cartRepository.findCartByUserId(userId);

      if (!cart) {
        cart = await cartRepository.createCart(userId);
      }

      const results = {
        success: [],
        failed: [],
        updatedCart: null,
      };

      for (const item of cartItems) {
        const { productId, quantity } = item;

        try {
          const product = await productRepository.getProductByProductId(
            productId
          );

          if (!product) {
            results.failed.push({
              productId,
              error: "Product not found",
              code: "PRODUCT_NOT_FOUND",
            });
            continue;
          }

          if (product.stock < quantity) {
            results.failed.push({
              productId,
              error: `Only ${product.stock} units available`,
              code: "INSUFFICIENT_STOCK",
              availableStock: product.stock,
            });
            continue;
          }

          const existingItem = cart.items.find(
            (cartItem) => cartItem.product.toString() === productId
          );

          const currentPrice =
            product.totalAmountAfterDiscount ||
            product.price * (1 - (product.discount || 0) / 100);

          if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;

            if (newQuantity > product.stock) {
              results.failed.push({
                productId,
                error: `Cannot exceed available stock of ${product.stock}`,
                code: "EXCEEDS_STOCK",
                availableStock: product.stock,
                currentInCart: existingItem.quantity,
              });
              continue;
            }

            existingItem.quantity = newQuantity;
            existingItem.totalAmountAfterDiscount = currentPrice;
          } else {
            cart.items.push({
              product: productId,
              quantity,
              totalAmountAfterDiscount: currentPrice,
              selectedSize: item.selectedSize || null,
              selectedColor: item.selectedColor || null,
              addedAt: new Date(),
              updatedAt: new Date(),
            });
          }

          results.success.push({
            productId,
            productName: product.name || product.productName,
            quantity: existingItem ? existingItem.quantity : quantity,
            price: currentPrice,
            message: existingItem ? "Quantity updated" : "Added to cart",
          });
        } catch (error) {
          results.failed.push({
            productId,
            error: error.message,
            code: "PROCESSING_ERROR",
          });
        }
      }

      if (results.success.length > 0) {
        await cartRepository.saveCart(cart);
        const updatedCart = await cartRepository.getCartWithProducts(userId);

        return {
          success: true,
          message: `Successfully processed ${results.success.length} item(s)`,
          cartItems: this.formatCartItemsResponse(updatedCart.items),
          loading: false,
          error: null,
          results: {
            success: results.success,
            failed: results.failed,
          },
        };
      }

      return {
        success: false,
        message: "Failed to process any items",
        cartItems: [],
        loading: false,
        error: results.failed.length > 0 ? "Some items failed to add" : null,
        results: {
          success: results.success,
          failed: results.failed,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        cartItems: [],
        loading: false,
        error: error.message,
      };
    }
  }

  async updateCartQuantity(userId, productId, quantity) {
    try {
      if (quantity < 1) {
        return {
          success: false,
          message: "Quantity must be at least 1",
          cartItems: [],
          loading: false,
          error: "Invalid quantity",
        };
      }

      // Get the product to check stock
      const product = await productRepository.getProductByProductId(productId);
      if (!product) {
        return {
          success: false,
          message: "Product not found",
          cartItems: [],
          loading: false,
          error: "Product not found",
        };
      }

      if (product.stock < quantity) {
        return {
          success: false,
          message: `Only ${product.stock} units available`,
          cartItems: [],
          loading: false,
          error: "Insufficient stock",
        };
      }

      const cart = await cartRepository.updateCartItemQuantity(
        userId,
        productId,
        quantity
      );

      if (!cart) {
        return {
          success: false,
          message: "Cart not found",
          cartItems: [],
          loading: false,
          error: "Cart not found",
        };
      }

      const updatedCart = await cartRepository.getCartWithProducts(userId);

      return {
        success: true,
        message: "Cart quantity updated successfully",
        cartItems: this.formatCartItemsResponse(updatedCart.items),
        loading: false,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        cartItems: [],
        loading: false,
        error: error.message,
      };
    }
  }

  async removeFromCart(userId, productId) {
    try {
      const cart = await cartRepository.removeItemFromCart(userId, productId);

      if (!cart) {
        return {
          success: false,
          message: "Cart not found",
          cartItems: [],
          loading: false,
          error: "Cart not found",
        };
      }

      const updatedCart = await cartRepository.getCartWithProducts(userId);

      return {
        success: true,
        message: "Product removed from cart successfully",
        cartItems: this.formatCartItemsResponse(updatedCart.items),
        loading: false,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        cartItems: [],
        loading: false,
        error: error.message,
      };
    }
  }

  async clearCart(userId) {
    try {
      const cart = await cartRepository.clearCart(userId);

      if (!cart) {
        return {
          success: false,
          message: "Cart not found",
          cartItems: [],
          loading: false,
          error: "Cart not found",
        };
      }

      return {
        success: true,
        message: "Cart cleared successfully",
        cartItems: [],
        loading: false,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        cartItems: [],
        loading: false,
        error: error.message,
      };
    }
  }

  async validateCartItems(cartItems) {
    const validatedItems = [];

    for (const item of cartItems) {
      const product = await productRepository.getProductByProductId(
        item.product
      );

      if (!product || !product.active) {
        continue;
      }

      const availableStock = product.stock;
      let quantity = item.quantity;
      let stockStatus = "available";

      if (availableStock === 0) {
        stockStatus = "out_of_stock";
        quantity = 0;
      } else if (quantity > availableStock) {
        stockStatus = "limited_stock";
        quantity = availableStock;
      }

      validatedItems.push({
        ...item,
        quantity,
        stockStatus,
        priceAtTimeOfAddition:
          product.totalAmountAfterDiscount ||
          product.price * (1 - (product.discount || 0) / 100),
      });
    }

    return validatedItems;
  }

  needsCartUpdate(originalItems, validatedItems) {
    if (originalItems.length !== validatedItems.length) return true;

    for (let i = 0; i < originalItems.length; i++) {
      if (originalItems[i].quantity !== validatedItems[i].quantity) return true;
    }

    return false;
  }

  formatCartResponse(cart, items = null) {
    const cartItems = items || cart.items;
    return this.formatCartItemsResponse(cartItems);
  }
}

module.exports = new CartService();
