const { createOrderValidation } = require("../validators/order.validtaion");
const orderService = require("../services/order.service");
const Logger = require("../utils/Logger");
const orderRepo = require("../repositories/order.repositories");

module.exports.createOrder = async (req, res) => {
  try {
    const validation = createOrderValidation(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const newOrder = await orderService.handleOrderOrigin(req);

    // Fire and forget - don't await
    // Fire and forget - don't await
    orderRepo
      .handleEmailConfirmation(newOrder, req?.user?._id)
      .then(() => {
        Logger.info(`Email sent for order ${newOrder._id}`);
      })
      .catch((emailError) => {
        Logger.error(`Email failed for order ${newOrder._id}:`, emailError);
        // Log to separate email error log or database
        // logEmailError(newOrder._id, emailError);
      });

    return res.status(201).json({
      success: true,
      message: "Order Created!",
      data: {
        newOrder,
        emailQueued: true,
      },
    });
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({
      // Fixed: res.status not res.staus
      success: false,
      message: error.message,
    });
  }
};

module.exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const isValid = await orderService.verifyRazorpayPayment(req.body);
    if (isValid.success) {
      return res.status(200).json({
        success: true,
        message: "Payment Verified",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: isValid.error || "Invalid Payment",
      });
    }
  } catch (error) {
    Logger.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

 module.exports.orderHistory = async (req, res) => {
   try {
     const userId = req.user._id; 
      const orders = await orderService.getOrderHistory(userId);
      return res.status(200).json({
        success: true,
        message: "Order history fetched successfully",
        data: orders,
      });
   }
    catch (error) {
      Logger.error(error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  module.exports.getOrderUsingTrackingId = async (req, res) => {
    try {
      const { trackingId } = req.params;
      const order = await orderService.getOrderByTrackingId(trackingId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }
      return res.status(200).json({
        success: true,
        message: "Order fetched successfully",
        data: order,
      });
    } catch (error) {
      Logger.error(error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };