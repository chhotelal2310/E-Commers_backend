const Logger = require("../utils/Logger");
const autocompleteService = require("../services/search.service");
const redis = require("../config/redis");

module.exports.searchProducts = async (req, res) => {
  try {
    const { q: query, page = 1, limit = 10 } = req.query;
    const cacheKey = `search:${query}:${page}:${limit}`;
    const cachedResult = await redis.get(cacheKey);

    if (cachedResult) {
      return res.json(JSON.parse(cachedResult));
    }

    const result = await autocompleteService.searchProducts(
      query,
      parseInt(page),
      parseInt(limit)
    );

    const response = {
      success: true,
      data: result.products,
      meta: {
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        limit: parseInt(limit),
        timestamp: new Date().toISOString(),
      },
    };

    await redis.set(cacheKey, JSON.stringify(response), "EX", 600); // 10 mins

    res.json(response);
  } catch (error) {
    Logger.error("Search products controller error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search products",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports.autocompleteProducts = async (req, res) => {
  try {
    const { q: query, categoryId, limit = 10 } = req.query;
    console.log("Autocomplete query:", query, categoryId, limit);

    const cacheKey = `autocomplete:${query}:${categoryId}:${limit}`;
    const cachedResult = await redis.get(cacheKey);

    if (cachedResult) {
      return res.json(JSON.parse(cachedResult));
    }
    const suggestions = await autocompleteService.autocompleteProducts(query, {
      limit: parseInt(limit),
      categoryId: categoryId || null,
    });

    const response = {
      success: true,
      data: suggestions,
      meta: {
        count: suggestions.length,
        query,
        hasMore: suggestions.length === parseInt(limit),
        timestamp: new Date().toISOString(),
      },
    };

    await redis.set(cacheKey, JSON.stringify(response), "EX", 300); // 5 mins

    res.json(response);
  } catch (error) {
    Logger.error("Autocomplete controller error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch suggestions",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports.getTrendingSearches = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const cacheKey = `trending:${limit}`;
    const cachedResult = await redis.get(cacheKey);

    if (cachedResult) {
      return res.json(JSON.parse(cachedResult));
    }
    const trendingSearches = await autocompleteService.getTrendingSearches(
      parseInt(limit),
    );
    const response = {
      success: true,
      data: trendingSearches,
      meta: {
        count: trendingSearches.length,
        limit: parseInt(limit),
        timestamp: new Date().toISOString(),
      },
    };

    await redis.set(cacheKey, JSON.stringify(response), "EX", 3600); // 1 hour

    res.json(response);
  } catch (error) {
    Logger.error("Get trending searches controller error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trending searches",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
