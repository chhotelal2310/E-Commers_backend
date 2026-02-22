const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: true,
    },
    categoryImage: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

categorySchema.virtual("products", {
  ref: "Product",
  foreignField: "categoryId",
  localField: "_id",
});

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;
