const express = require("express")
const Company = require("../models/Company")
const User = require("../models/User")
const jwt = require("jsonwebtoken")
const {
  registerCompanyRules,
  validateRules,
} = require("../middlewares/validators")

const authenticationRouter = express.Router()

authenticationRouter.post(
  "/register-company",
  registerCompanyRules,
  validateRules,
  async (req, res) => {
    try {
      const { companyName, location, adminEmail, fullName, password } = req.body
      // check if company is already registered
      let existingCompany = await Company.find({ adminEmail: adminEmail })
      if (existingCompany.length > 0) {
        return res.status(401).json({
          success: false,
          errors: {
            adminEmail:
              "An admin account with that email exist, login to continue.",
          },
        })
      }
      existingCompany = await Company.find({
        companyName: companyName,
        location: location,
      })
      if (existingCompany.length > 0) {
        return res.status(401).json({
          success: false,
          errors: {
            location: `${companyName} is already registered at this location.`,
          },
        })
      }
      let newCompanyDoc = new Company({
        companyName,
        adminEmail,
        location,
      })
      let newCompany = await newCompanyDoc.save()
      let newUserDoc = new User({
        fullName,
        email: adminEmail,
        role: "admin",
        password,
        companyId: newCompany._id,
      })
      let newUser = await newUserDoc.save()
      let token = jwt.sign(
        {
          companyId: newCompany._id,
          userId: newUser._id,
        },
        process.env.JWT_SECRET,
        { expiresIn: "9h" }
      )
      return res.status(201).json({
        success: true,
        message: "Company registered Successully.",
        token,
      })
    } catch (e) {
      console.log("Error while registring company.", e)
      return res.status(402).json({
        success: false,
        errors: {
          error: e.message || "Error while registring company.",
        },
      })
    }
  }
)

module.exports = authenticationRouter
