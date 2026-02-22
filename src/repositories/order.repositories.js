const Order = require("../models/order.model");
const productRepo = require("../repositories/product.repositories");
const userRepo = require("../repositories/user.repositories");
const { sendEmail } = require("../utils/sendEmail");
const emailRenderer = require("../utils/emailRenderer");
const Product = require("../models/product.model");
const razorpay = require("../config/razor");
class orderRepo {
  async handleCashOnDelivery(data) {
    await productRepo.updateProductQuantity(data.productSummary);
    const order = await Order.create(data);
    return order;
  }
  async updateOrderPaymentStatus(orderId, data) {
    await Order.findByIdAndUpdate(orderId, {
      payment_details: {
        status: data ? "completed" : "pending",
        transactionId: data ? data.razorpay_payment_id : null,
        paymentDate: data ? new Date().toISOString() : null,
        totalPaidAmount: data ? data.amount / 100 : null,
      },
    });
  }
  async handleRazorPayOrder(data) {
    // await productRepo.updateProductQuantity(data.productSummary);
    // const dbOrder = await Order.create(data);
    const dbOrder = await Order.create(data);
    // Removed erroneous status update that was marking order as completed immediately

    // this.updateOrderPaymentStatus(dbOrder._id, {
    //   status: "pending",
    //   transactionId: null,
    // });
    const razorpayOrder = await razorpay.orders.create({
      amount: data.finalAmount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });
    return { ...razorpayOrder, order_id: dbOrder._id, _id: dbOrder._id, productStatus: dbOrder.productStatus, finalAmount: dbOrder.finalAmount, payment_Method: "RazorPay", trackingId: dbOrder.trackingId, address: dbOrder.address };
  }
  async getOrderById(orderId) {
    const order = await Order.findById(orderId);
    return order;
  }

  async handleEmailConfirmation(newOrder, userId) {
    try {
      const user = await userRepo.findUserById(userId);
      const htmlContent = emailRenderer.render("order", {
        userName: user.fullName,
        trackingLink: `https://infinite-mart-ecom.vercel.app/track-Order`,
        order: newOrder,
      });
      await sendEmail(
        user.email,
        "Order Confirmation",
        htmlContent,
        `Your order with ID ${newOrder.trackingId} has been successfully placed.`
      );
    } catch (error) {
      console.error("Error in handleEmailConfirmation:", error);
      // If Logger is available in this file scope or imported, use it.
      // Based on previous file view, Logger was not imported in order.repositories.js
      // I will add console.error for now or check imports.
      // Wait, I should verify if Logger is imported.
    }
  }

  async fetchOrdersByUserId(userId) {
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    return orders;
  }

  async decreaseStockForOrder(orderId, productSummary, options = {}) {
    const session = options.session || (await mongoose.startSession());

    // If we created a new session, we manage transaction lifecycle
    const manageTransaction = !options.session;

    if (manageTransaction) {
      session.startTransaction();
    }

    try {
      // Process each product in the summary
      for (const item of productSummary) {
        const productId = item.productId;
        const requestedQty = Number(item.quantity);

        if (!productId || isNaN(requestedQty) || requestedQty <= 0) {
          throw new Error(
            `Invalid product data in summary for item: ${item._id}`
          );
        }

        // Atomic stock decrease
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: productId,
            stock: { $gte: requestedQty }, // Prevents going negative
          },
          {
            $inc: { stock: -requestedQty },
          },
          {
            new: true, // Return updated document
            session, // Transaction support
            runValidators: true,
          }
        );
        console.log("Updated product stock:", updatedProduct);
        if (!updatedProduct) {
          // Either product not found OR stock insufficient
          const product = await Product.findById(productId).session(session);
          if (!product) {
            throw new Error(`Product not found: ${productId}`);
          }
          throw new Error(
            `Insufficient stock for product ${productId}. ` +
              `Required: ${requestedQty}, Available: ${product.stock}`
          );
        }
      }

      // If we manage the transaction → commit it
      if (manageTransaction) {
        await session.commitTransaction();
      }

      return {
        success: true,
        message: `Stock decreased successfully for ${productSummary.length} items`,
      };
    } catch (error) {
      if (manageTransaction) {
        await session.abortTransaction().catch(console.error);
      }

      return {
        success: false,
        message: error.message,
        error,
        // Optional: which product failed (useful for user feedback)
        failedProduct: error.message.includes("product")
          ? error.message.split("product ")[1]?.split(" ")[0]
          : null,
      };
    } finally {
      // Only end session if we created it
      if (manageTransaction) {
        session.endSession();
      }
    }
  }

  async fetchOrderByTrackingId(trackingId) {
    const order = await Order.findOne({ trackingId: trackingId });
    return order;
  }
}

module.exports = new orderRepo();
