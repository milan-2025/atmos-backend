const { body, validationResult } = require("express-validator")

const validateRules = (req, res, next) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    // get the array of errors
    const errorArray = errors.array()
    // format errors
    const formattedErrors = errorArray.reduce((acc, currError) => {
      acc[currError.path] = currError.msg
      return acc
    }, {})

    return res.status(400).json({
      success: false,
      errors: formattedErrors,
    })
  }
  next()
}

const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/
const passwordErrorMsg =
  "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."

const registerCompanyRules = [
  body("companyName")
    .trim()
    .notEmpty()
    .withMessage("Company Name is Required."),

  body("adminEmail")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Enter a valid email.")
    .normalizeEmail(),

  body("location")
    .trim()
    .notEmpty()
    .withMessage("Company Location is required."),

  body("fullName").trim().notEmpty().withMessage("Full Name is required."),
  body("password")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(strongPasswordRegex)
    .withMessage(passwordErrorMsg),
]

module.exports = {
  validateRules,
  registerCompanyRules,
}
