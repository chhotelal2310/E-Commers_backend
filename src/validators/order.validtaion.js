const Joi = require("joi");

const createOrderValidation = (data) => {
  const schema = Joi.object({
    userId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional(),

    finalAmount: Joi.number().positive().required(),
    discount: Joi.number().min(0).default(0),
    payment_Method: Joi.string().valid("COD", "RazorPay", "Paytm").required(),
    deleiveryCharge: Joi.number().min(0).required(),
    tax: Joi.number().min(0).default(18),

    productSummary: Joi.array()
      .items(
        Joi.object({
          productId: Joi.string().required(),
          quantity: Joi.number().integer().min(1).required(), // Fixed typo
          subTotal: Joi.number().positive().required(),
        })
      )
      .min(1)
      .required(),

    address: Joi.object({
      street: Joi.string().min(2).max(100).required(), // Increased max length
      city: Joi.string().min(2).max(50).required(),
      state: Joi.string().min(2).max(50).required(),
      postalCode: Joi.string().min(3).max(20).required(),
      country: Joi.string().min(2).max(50).default("US"),
      addressType: Joi.string()
        .valid("home", "work", "billing", "shipping", "other")
        .default("home"),
    }).required(),

    // Optional fields for payment details if provided upfront
    payment_details: Joi.object({
      status: Joi.string().valid("pending", "completed"),
      transactionId: Joi.string(),
      paymentDate: Joi.date().iso(),
      totalPaidAmount: Joi.number().min(0),
    }).optional(),
  });

  const { error } = schema.validate(data, { abortEarly: false }); // Show all errors

  if (error) {
    return {
      isValid: false,
      message: error.details.map((detail) => detail.message).join(", "),
    };
  }

  return {
    isValid: true,
  };
};

module.exports = {
  createOrderValidation,
};
