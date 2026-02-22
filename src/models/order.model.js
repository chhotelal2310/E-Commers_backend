const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    trackingId: {
      type: String,
      unique: true,
      default: function () {
        const randomNum = Math.floor(10000000 + Math.random() * 90000000);
        return `#IMO_${randomNum}`;
      },
    },
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    finalAmount: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    address: {
      street: {
        type: String,
        required: true,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        required: true,
        trim: true,
      },
      postalCode: {
        type: String,
        required: true,
        trim: true,
      },
      country: {
        type: String,
        required: true,
        default: "US",
        trim: true,
      },
      addressType: {
        type: String,
        enum: ["home", "work", "billing", "shipping", "other"],
        default: "home",
      },
    },
    productStatus: {
      type: String,
      enum: [
        "Confirmed",
        "Shipped",
        "On the Way",
        "Out for Delivery",
        "Deleiverd",
        "Refund Proceed",
        "Refunded",
        "Canceled",
      ],
      default: "Confirmed",
    },
    payment_Method: {
      type: String,
      enum: ["COD", "RazorPay", "Paytm"],
      required: true,
    },
    payment_details: {
      status: {
        type: String,
        enum: ["pending", "completed"],
        default: "pending",
      },
      transactionId: {
        type: String,
      },
      paymentDate: {
        type: String,
      },
      totalPaidAmount: {
        type: Number,
        default: 0,
        set: function (v) {
          // Convert NaN to null or 0
          return isNaN(v) ? 0 : v;
        },
      },
    },
    deleiveryCharge: {
      type: Number,
    },
    tax: {
      type: Number,
      default: 18,
    },

    productSummary: [
      {
        productId: {
          type: String,
        },
        quantity: {
          type: Number,
        },
        subTotal: {
          type: Number,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
