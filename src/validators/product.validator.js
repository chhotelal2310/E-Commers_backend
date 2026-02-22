const Joi = require("joi");

const addProductSchemaValidator = (data) => {
  const schema = Joi.object({
    productName: Joi.string().min(4).max(100).required(),
    categoryId: Joi.string()
      .messages(
        { "any.required": "CategoryId Must be in Payload" },
        { "any.empty": "Category Id Can not be empty" }
      )
      .required(),
    productSlug: Joi.string().optional(),
    reviewId: Joi.string().optional().allow(""),
    productImage: Joi.array().items(Joi.string().uri()).min(1),
    stock: Joi.number().min(1).required(),
    price: Joi.number().min(1).required(),
    discount: Joi.number().optional(),
    productDescription: Joi.string().min(100).max(10000).required(),
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
  addProductSchemaValidator,
};
