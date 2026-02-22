const logger = require("../utils/Logger");
const serchRepo = require("../repositories/seach.repositories");
const Product = require("../models/product.model");
class SearchService {
  constructor() {
    this.MAX_SUGGESTIONS = 15;
    this.MIN_QUERY_LENGTH = 2;
  }
  async _getPopularProducts(limit, categoryId) {
    const filter = {
      isActive: true,
      stock: { $gt: 0 }, // stock greater than 0
    };
    if (categoryId) {
      filter.categoryId = categoryId;
    }
    const products = await serchRepo.getPopularProductsUsingFilter(
      limit,
      filter,
    );
    return this._formatSuggestions(products.map((p) => ({ ...p, score: 0.3 })));
  }
  async searchProducts(query, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const filter = {
      $text: { $search: query },
      isActive: true,
      stock: { $gt: 0 },
    };

    const [products, totalCount] = await Promise.all([
      Product.find(filter)
        .select(
          "_id productName productSlug productImage price totalAmountAfterDiscount categoryId searchCount score"
        )
        .populate("categoryId", "name slug")
        .sort({ score: { $meta: "textScore" } })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return {
      products: this._formatSuggestions(products),
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  }

  async autocompleteProducts(query, options = {}) {
    const { limit = 10, categoryId = null, threshold = 0.3 } = options;
    const searchQuery = query.toLowerCase().trim();
    if (!searchQuery || searchQuery.length < this.MIN_QUERY_LENGTH) {
      return this._getPopularProducts(limit, categoryId);
    }
    try {
      const strategies = [
        this._searchExactMatch.bind(this),
        this._searchStartsWith.bind(this),
        this._searchContains.bind(this),
        this._searchTextIndex.bind(this),
        this._searchKeywords.bind(this),
      ];
      const results = new Map();

      for (const strategy of strategies) {
        const foundProducts = await strategy(
          searchQuery,
          limit * 2,
          categoryId,
        );

        this._mergeResults(results, foundProducts, strategy.name);

        // Stop if we have enough high-quality results
        if (results.size >= limit * 3) {
          break;
        }
      }

      // Apply relevance scoring and filtering
      const scoredResults = this._scoreResults(results, searchQuery);
      const filteredResults = scoredResults
        .filter((item) => item.score >= threshold)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // Format results
      const suggestions = this._formatSuggestions(filteredResults);

      // Update search counts (async, don't wait)
      this._updateSearchCounts(searchQuery).catch((error) => {
        logger.warn("Failed to update search counts:", error);
      });

      return suggestions;
    } catch (err) {
      logger.error("Error in autocompleteProducts:", err);
      return this._getPopularProducts(limit, categoryId);
    }
  }
  /**
   * Search Strategy 1: Exact match
   */
  async _searchExactMatch(query, limit, categoryId) {
    const filter = {
      productNameLowerCase: query,
      isActive: true,
      stock: { $gt: 0 },
    };

    if (categoryId) filter.categoryId = categoryId;

    return Product.find(filter)
      .select(
        "_id productName productSlug productImage price totalAmountAfterDiscount categoryId searchCount",
      )
      .populate("categoryId", "name slug")
      .limit(limit)
      .lean();
  }

  /**
   * Search Strategy 2: Starts with
   */
  async _searchStartsWith(query, limit, categoryId) {
    const filter = {
      productNameLowerCase: { $regex: `^${query}`, $options: "i" },
      isActive: true,
      stock: { $gt: 0 },
    };

    if (categoryId) filter.categoryId = categoryId;

    return Product.find(filter)
      .select(
        "_id productName productSlug productImage price totalAmountAfterDiscount categoryId searchCount",
      )
      .populate("categoryId", "name slug")
      .limit(limit)
      .lean();
  }

  /**
   * Search Strategy 3: Contains
   */
  async _searchContains(query, limit, categoryId) {
    const words = query.split(" ").filter((w) => w.length > 2);
    if (words.length === 0) return [];

    const filter = {
      $or: words.map((word) => ({
        productNameLowerCase: { $regex: word, $options: "i" },
      })),
      isActive: true,
      stock: { $gt: 0 },
    };

    if (categoryId) filter.categoryId = categoryId;

    return Product.find(filter)
      .select(
        "_id productName productSlug productImage price totalAmountAfterDiscount categoryId searchCount",
      )
      .populate("categoryId", "name slug")
      .limit(limit)
      .lean();
  }

  /**
   * Search Strategy 4: MongoDB Text Search
   */
  async _searchTextIndex(query, limit, categoryId) {
    const filter = {
      $text: { $search: query },
      isActive: true,
      stock: { $gt: 0 },
    };

    if (categoryId) filter.categoryId = categoryId;

    return Product.find(filter)
      .select(
        "_id productName productSlug productImage price totalAmountAfterDiscount categoryId searchCount",
      )
      .populate("categoryId", "name slug")
      .limit(limit)
      .lean();
  }

  /**
   * Search Strategy 5: Search Keywords
   */
  async _searchKeywords(query, limit, categoryId) {
    const filter = {
      searchKeywords: query,
      isActive: true,
      stock: { $gt: 0 },
    };

    if (categoryId) filter.categoryId = categoryId;

    return Product.find(filter)
      .select(
        "_id productName productSlug productImage price totalAmountAfterDiscount categoryId searchCount",
      )
      .populate("categoryId", "name slug")
      .limit(limit)
      .lean();
  }

  /**
   * Merge results from different strategies
   */
  _mergeResults(resultsMap, products, strategy) {
    if (!products || !Array.isArray(products)) return;

    const strategyWeights = {
      _searchExactMatch: 1.0,
      _searchStartsWith: 0.8,
      _searchContains: 0.6,
      _searchTextIndex: 0.5,
      _searchKeywords: 0.4,
    };

    products.forEach((product) => {
      const key = product._id.toString();

      if (!resultsMap.has(key)) {
        product._searchStrategies = [strategy];
        product._relevance = strategyWeights[strategy] || 0.3;
        resultsMap.set(key, product);
      } else {
        const existing = resultsMap.get(key);
        if (!existing._searchStrategies.includes(strategy)) {
          existing._searchStrategies.push(strategy);
          existing._relevance += (strategyWeights[strategy] || 0.3) * 0.2;
        }
      }
    });
  }

  /**
   * Score results based on multiple factors
   */
  _scoreResults(resultsMap, query) {
    return Array.from(resultsMap.values()).map((product) => {
      let score = product._relevance || 0.3;

      // Boost by popularity
      if (product.searchCount > 100) score *= 1.2;
      else if (product.searchCount > 10) score *= 1.1;

      // Boost by name length match
      const nameWords = product.productName.toLowerCase().split(" ");
      const queryWords = query.split(" ");

      // Exact word matches
      const exactMatches = queryWords.filter((qWord) =>
        nameWords.some((nWord) => nWord === qWord),
      ).length;

      score += (exactMatches / queryWords.length) * 0.3;

      // Partial matches
      const partialMatches = queryWords.filter((qWord) =>
        nameWords.some((nWord) => nWord.includes(qWord)),
      ).length;

      score += (partialMatches / queryWords.length) * 0.2;

      return {
        ...product,
        score: Math.min(score, 1.0), // Cap at 1.0
      };
    });
  }
  async _updateSearchCounts(query) {
    try {
      const words = query.split(" ").filter((w) => w.length > 2);

      if (words.length === 0) return;

      // Update products that match the query
      await Product.updateMany(
        {
          $or: [
            { productNameLowerCase: { $regex: query, $options: "i" } },
            { searchKeywords: { $in: words } },
          ],
          isActive: true,
        },
        { $inc: { searchCount: 1 } },
      );
    } catch (error) {
      logger.error("Failed to update search counts:", error);
    }
  }

  _formatSuggestions(products) {
    return products.map((product) => ({
      id: product._id,
      name: product.productName,
      slug: product.productSlug,
      image: product.productImage?.[0] || null,
      price: product.price,
      discountedPrice: product.totalAmountAfterDiscount,
      category:
        product.categoryId ?
          {
            id: product.categoryId._id,
            name: product.categoryId.name,
          }
        : null,
      hasDiscount: product.price > product.totalAmountAfterDiscount,
      relevance: product.score || 0.3,
      inStock: product.stock > 0,
    }));
  }
  async getTrendingSearches(limit = 10) {
    try {
      const trending = await Product.find({
        searchCount: { $gt: 0 },
        isActive: true,
      })
        .select("productName productSlug searchCount")
        .sort({ searchCount: -1 })
        .limit(limit)
        .lean();

      return trending.map((item) => ({
        query: item.productName,
        slug: item.productSlug,
        count: item.searchCount,
      }));
    } catch (error) {
      logger.error("Failed to get trending searches:", error);
      return [];
    }
  }
}

module.exports = new SearchService();
