const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    comments: {
      type: String,
      required: true,
    },
    star: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
