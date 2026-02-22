const CASH_ON_DELIVERY = "COD";
const orderRepo = require("../repositories/order.repositories");
const razorpay = require("../config/razor");
const Order = require("../models/order.model");
const mongoose = require("mongoose");
const crypto = require("crypto");
class orderService {
  async handleOrderOrigin(req) {
    const orderData = { ...req.body, userId: req.user._id };
    
    if (
      req?.body?.payment_Method.toLowerCase() === CASH_ON_DELIVERY.toLowerCase()
    ) {
      const newOrder = await orderRepo.handleCashOnDelivery(orderData);
      return newOrder;
    } else if (
      req?.body?.payment_Method.toLowerCase() === "RazorPay".toLowerCase()
    ) {
      const razorOrder = await orderRepo.handleRazorPayOrder(orderData);
      return razorOrder;
    }
  }

  // async verifyRazorpayPayment(data) {
  //   const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

  //   const body = razorpay_order_id + "|" + razorpay_payment_id;

  //   try {
  //     const expectedSignature = crypto
  //       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
  //       .update(body)
  //       .digest("hex");

  //     if (expectedSignature === razorpay_signature) {
  //       // Optionally fetch payment details from Razorpay API
  //       const payment = await razorpay.payments.fetch(razorpay_payment_id);

  //       if (payment.status === "captured") {
  //         const order = await orderRepo.getOrderById(data.orderId);
  //         if (order) {
  //           await orderRepo.updateOrderPaymentStatus(data.orderId, data);
  //           return { success: true, payment };
  //         }
  //         return { success: false, error: "Order not found" };
  //       }
  //       return {
  //         success: false,
  //         error: `Payment not captured: ${payment.status}`,
  //       };
  //     }
  //     return { success: false, error: "Invalid signature" };
  //   } catch (error) {
  //     return { success: false, error: error.message };
  //   }
  // }

  async verifyRazorpayPayment(data) {
    console.log("Verifying Razorpay payment with data:", data);
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = data;

    try {
      // 1. Verify signature
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return {
          success: false,
          error: "Invalid signature - payment verification failed",
        };
      }

      // 2. Get payment details from Razorpay
      const payment = await razorpay.payments.fetch(razorpay_payment_id);

      if (!payment || payment.status !== "captured") {
        return {
          success: false,
          error: `Payment not captured (status: ${
            payment?.status || "unknown"
          })`,
        };
      }

      // 3. Start transaction for atomicity
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // 4. Find and lock the order
        const order = await Order.findById(orderId).session(session);
        if (!order) {
          throw new Error("Order not found");
        }
        console.log("Order found for verification:", orderId);
        if (order.payment_details?.status === "completed") {
          await session.commitTransaction();
          return {
            success: true,
            message: "Order already processed successfully",
            alreadyProcessed: true,
          };
        }

        if (order.payment_details?.status !== "pending") {
          throw new Error(
            `Order payment status is invalid: ${order.payment_details?.status}`
          );
        }

        // 5. Decrease stock atomically
        const stockResult = await orderRepo.decreaseStockForOrder(
          orderId,
          order.productSummary,
          { session }
        );
        console.log("Stock decrease result:", stockResult);
        if (!stockResult.success) {
          throw new Error(stockResult.message);
        }

        // 6. Update order to paid/completed
        await Order.findByIdAndUpdate(
          orderId,
          {
            $set: {
              "payment_details.status": "completed",
              "payment_details.transactionId": razorpay_payment_id,
              "payment_details.paymentDate": new Date().toISOString(),
              "payment_details.totalPaidAmount": Number(payment.amount) / 100, // Razorpay returns in paise
              productStatus: "Confirmed", // or keep your default
              updatedAt: new Date(),
            },
          },
          { session, new: true }
        );

        await session.commitTransaction();

        return {
          success: true,
          message: "Payment verified & order processed successfully",
          orderId,
          paymentId: razorpay_payment_id,
        };
      } catch (innerError) {
        await session.abortTransaction();

        // Optional: mark as failed
        await Order.findByIdAndUpdate(orderId, {
          $set: {
            "payment_details.status": "failed",
            // you can add failed reason if you want
          },
        }).catch(() => {});

        throw innerError;
      } finally {
        session.endSession();
      }
    } catch (error) {
      console.error("Razorpay verification failed:", {
        orderId,
        paymentId: razorpay_payment_id,
        error: error.message,
      });

      return {
        success: false,
        error:
          error.message || "Internal server error during payment verification",
      };
    }
  }

  async getOrderHistory(userId) {
    const orders = await orderRepo.fetchOrdersByUserId(userId);
    return orders;
  }
  async getOrderByTrackingId(trackingId) {
    const order = await orderRepo.fetchOrderByTrackingId(trackingId);
    return order;
  }
}
module.exports = new orderService();
