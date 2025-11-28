const express = require("express")
// const Company = require("../models/Company")
// const User = require("../models/User")
// const jwt = require("jsonwebtoken")
// const bcrypt = require("bcryptjs")
const {
  registerCompanyRules,
  validateRules,
  loginRules,
  setupPasswordRules,
} = require("../middlewares/validators")
// const { errorHandlerFunction } = require("../util")
const { validateToken, adminCheck } = require("../middlewares/auth")
const authenticationController = require("../controllers/authentication.controller")

const authenticationRouter = express.Router()

authenticationRouter.post(
  "/register-company",
  registerCompanyRules,
  validateRules,
  authenticationController.registerCompany
)

authenticationRouter.post(
  "/login",
  loginRules,
  validateRules,
  authenticationController.login
)

authenticationRouter.post(
  "/setup-password",
  // setupPasswordRules,
  // validateRules,
  authenticationController.setupPassword
)

authenticationRouter.post(
  "/check-token",
  validateToken,
  authenticationController.checkToken
)

authenticationRouter.post(
  "/check-admin",
  validateToken,
  adminCheck,
  authenticationController.checkAdmin
)

authenticationRouter.post(
  "/check-special-token",
  authenticationController.checkSpecialToken
)

authenticationRouter.post(
  "/check-qa-meeting",
  validateToken,
  authenticationController.checkQaMeeting
)

module.exports = authenticationRouter
