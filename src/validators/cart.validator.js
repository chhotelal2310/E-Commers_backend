// validators/cartValidator.js
const Joi = require("joi");

// For bulk add with cartItems array
const addToCartSchemaValidator = (data) => {
  const schema = Joi.object({
    cartItems: Joi.array()
      .items(
        Joi.object({
          productId: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
              "string.pattern.base": "Invalid product ID format",
              "any.required": "Product ID is required",
              "string.empty": "Product ID cannot be empty",
            }),

          quantity: Joi.number().integer().min(1).required().messages({
            "number.base": "Quantity must be a number",
            "number.integer": "Quantity must be a whole number",
            "number.min": "Quantity must be at least 1",
            "any.required": "Quantity is required",
          }),

          totalAmountAfterDiscount: Joi.number()
            .positive()
            .required()
            .messages({
              "number.base": "Price must be a number",
              "number.positive": "Price must be positive",
            }),
        })
      )
      .min(1)
      .required()
      .messages({
        "array.base": "cartItems must be an array",
        "array.min": "At least one item is required",
        "any.required": "cartItems array is required",
      }),
  });

  const { error } = schema.validate(data, { abortEarly: false });

  if (error) {
    return {
      isValid: false,
      message: error.details.map((detail) => detail.message).join(", "),
      errors: error.details,
    };
  }

  return {
    isValid: true,
  };
};

module.exports = {
  addToCartSchemaValidator,
};
