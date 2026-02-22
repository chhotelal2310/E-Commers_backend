// scripts/migrateProductSearch.js
const mongoose = require("mongoose");
const Product = require("../models/product.model");
require("dotenv").config();

async function migrateProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Run the update
    await Product.updateAllWithSearchKeywords();

    // Create indexes if they don't exist
    await Product.collection.createIndex(
      { productNameLowerCase: 1, categoryId: 1, searchCount: -1 },
      { background: true },
    );

    await Product.collection.createIndex(
      { searchKeywords: 1, searchCount: -1 },
      { background: true },
    );

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateProducts();
