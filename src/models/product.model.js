const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    // Used for URL-friendly navigation
    productSlug: {
      type: String,
      index: true,
    },
    // Reference to Category Model
    categoryId: {
      ref: "Category",
      type: mongoose.Schema.ObjectId,
      required: true,
      index: true,
    },
    // [NEW] Store category name as string for AI/Search (e.g. "Smartphone")
    category: {
      type: String,
      index: true,
    },
    // Reference to Review Model
    reviewId: {
      ref: "Review",
      type: mongoose.Schema.ObjectId,
    },
    productImage: [
      {
        type: String,
        required: true,
      },
    ],
    stock: {
      type: Number,
      default: 1,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalAmountAfterDiscount: {
      type: Number,
    },
    productDescription: {
      type: String,
      required: true,
    },
    // [NEW] Brand name (e.g. "Samsung", "Nike") - Critical for AI filtering
    brand: {
        type: String,
        index: true,
        trim: true
    },
    // [NEW] Key features list (e.g. ["5G", "120Hz Screen", "Waterproof"])
    features: {
        type: [String],
        default: [],
        index: true
    },
    // [NEW] Technical specs (e.g. { "RAM": "8GB", "Storage": "128GB" })
    specifications: {
        type: Map,
        of: String,
        default: {}
    },
    searchKeywords: {
      type: [String],
      default: [],
      index: true,
    },
    // For popularity-based suggestions
    searchCount: {
      type: Number,
      default: 0,
      index: true,
    },
    // For typo tolerance
    productNameLowerCase: {
      type: String,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// -------------------------
// INDEXING
// -------------------------
productSchema.index(
  {
    productName: "text",
    productDescription: "text",
    searchKeywords: "text",
    brand: "text",       // Index brand text
    category: "text",    // Index category text
    features: "text"     // Index features text
  },
  {
    weights: {
      productName: 10,
      brand: 8,          
      category: 6,
      searchKeywords: 5,
      features: 3,
      productDescription: 1,
    },
    name: "product_search_index",
  },
);

// Compound indexes for common query patterns
productSchema.index({ productNameLowerCase: 1 });
productSchema.index({ brand: 1, price: 1 });        
productSchema.index({ category: 1, price: 1 });
productSchema.index({ isActive: 1, brand: 1 });
productSchema.index({ searchKeywords: 1, searchCount: -1 });


// -------------------------
// MIDDLEWARE (HOOKS)
// -------------------------

// Calculate Discount
productSchema.pre("save", function (next) {
  if (this.discount && this.discount > 0) {
    const calculateDiscount = (this.price * this.discount) / 100;
    this.totalAmountAfterDiscount = this.price - calculateDiscount;
  } else {
    this.totalAmountAfterDiscount = this.price;
  }
  next();
});

// Generate Slug
productSchema.pre("save", function (next) {
  if (this.productName && !this.productSlug) {
    this.productSlug = this.productName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // remove non-word chars
      .replace(/[\s_-]+/g, "-") // collapse dashes/spaces
      .replace(/^-+|-+$/g, ""); // trim dashes
  }
  next();
});

// Generate Lowercase Name
productSchema.pre("save", function (next) {
    if (this.productName) {
        this.productNameLowerCase = this.productName.toLowerCase();
    }
    next();
});

// -------------------------
// METHODS
// -------------------------

productSchema.methods.generateSearchKeywords = function (productName) {
  if (!productName) return [];

  const words = productName.toLowerCase().split(/\s+/);
  const keywords = new Set();

  // Add full name
  keywords.add(productName.toLowerCase().trim());

  // Add individual words (minimum 2 chars)
  words.forEach((word) => {
    const cleanWord = word.replace(/[^\w]/g, "");
    if (cleanWord.length > 1) {
      keywords.add(cleanWord);
    }
  });

  // Add n-grams for partial matching (2-3 word combinations)
  for (let i = 0; i < words.length; i++) {
    let ngram = "";
    for (let j = i; j < Math.min(i + 4, words.length); j++) {
      ngram += (j > i ? " " : "") + words[j];
      if (ngram.length > 2) {
        keywords.add(ngram);
      }
    }
  }

  // Add common variations
  words.forEach((word) => {
    // Add singular/plural variations (simple)
    if (word.endsWith("s") && word.length > 3) {
      keywords.add(word.slice(0, -1));
    } else if (!word.endsWith("s") && word.length > 2) {
      keywords.add(word + "s");
    }

    // Add partial word matches for longer words
    if (word.length > 4) {
      for (let len = 3; len <= word.length; len++) {
        keywords.add(word.substring(0, len));
      }
    }
  });

  return Array.from(keywords);
};

// Static method to update all existing products
productSchema.statics.updateAllWithSearchKeywords = async function () {
  const products = await this.find({
    $or: [
      { searchKeywords: { $exists: false } },
      { searchKeywords: [] },
      { productNameLowerCase: { $exists: false } },
    ],
  });

  console.log(`Updating ${products.length} products with search keywords...`);

  for (const product of products) {
    try {
      // Generate lowercase name if missing
      if (!product.productNameLowerCase && product.productName) {
        product.productNameLowerCase = product.productName.toLowerCase();
      }

      // Generate search keywords if missing
      if (
        (!product.searchKeywords || product.searchKeywords.length === 0) &&
        product.productName
      ) {
        product.searchKeywords = product.generateSearchKeywords(
          product.productName,
        );
      }

      // Save the product
      await product.save();
      console.log(`Updated product: ${product.productName}`);
    } catch (error) {
      console.error(`Error updating product ${product._id}:`, error.message);
    }
  }

  console.log("Update completed!");
};

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
