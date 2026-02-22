const Category = require("../models/category.model");
class categoryRepo {
  async addCategory(data) {
    const newCategory = await Category.create(data);
    return await newCategory.save();
  }
  async getAll() {
    return await Category.find();
  }
}

module.exports = new categoryRepo();
