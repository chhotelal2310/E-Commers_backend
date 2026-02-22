const Joi = require("joi");

const signUpValidator = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().min(4).required().label("firstName"),
    lastName: Joi.string().min(4).required().label("lastName"),
    passWord: Joi.string().min(8).required().label("passWord"),
    email: Joi.string().email().required().label("Email").messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),
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

const sendOtpValidator = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().label("Email").messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),
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
const verifyOtpValidator = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().label("Email").messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),
    otp: Joi.string().min(4).max(4).required().label("otp"),
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
const loginValidator = (data) => {
  const schema = Joi.object({
    passWord: Joi.string().min(8).required().label("passWord"),
    email: Joi.string().email().required().label("Email").messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),
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

const updateUserDetailsValidator = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().min(4).max(8).optional(),
    lastName: Joi.string().min(4).max(8).optional(),
    email: Joi.string().email().optional(),
    address: Joi.array()
      .items(
        Joi.object({
          street: Joi.string().min(4).max(20).required(),
          city: Joi.string().min(4).max(20).required(),
          state: Joi.string().min(4).max(20).required(),
          postalCode: Joi.string().min(4).max(20).required(),
          country: Joi.string().min(4).max(20).required(),
          isDefault: Joi.boolean().default(false),
          addressType: Joi.string()
            .valid("home", "work", "billing", "shipping", "other")
            .required(),
        })
      )
      .optional(),
    phoneNumber: Joi.string().min(10).max(15).optional(),
  }).or("firstName", "lastName", "email", "address", "phoneNumber");

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
  signUpValidator,
  sendOtpValidator,
  verifyOtpValidator,
  loginValidator,
  updateUserDetailsValidator,
};
