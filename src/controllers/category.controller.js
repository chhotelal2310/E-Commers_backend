const Logger = require("../utils/Logger");
const {
  addCategorySchemaValidator,
} = require("../validators/category.validator");
const categoryRepo = require("../repositories/category.repositories");
module.exports.addCategory = async (req, res) => {
  const validation = addCategorySchemaValidator(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: validation.message,
    });
  }

  try {
    await categoryRepo.addCategory(req.body);
    return res.status(201).json({
      success: true,
      message: "Category Added Succefully!",
    });
  } catch (error) {
    Logger.error(error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.getAll = async (req, res) => {
  //no validation needed

  try {
    const allCategory = await categoryRepo.getAll();

    return res.status(200).json({
      success: true,
      data: allCategory,
      message: "Succesfully Retrievd!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
