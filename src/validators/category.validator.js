const Joi = require("joi");

const addCategorySchemaValidator = (data) => {
  const schema = Joi.object({
    categoryName: Joi.string().min(4).max(100).required(),
  });

  const { error } = schema.validate(data);
  if (error) {
    return {
      isValid: false,
      message: error.details[0].message,
    };
  }

  return {
    isValid: true,
  };
};

module.exports = {
  addCategorySchemaValidator,
};
