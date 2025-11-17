const express = require("express")
const Company = require("../models/Company")
const User = require("../models/User")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const {
  registerCompanyRules,
  validateRules,
  loginRules,
  setupPasswordRules,
} = require("../middlewares/validators")
const { errorHandlerFunction } = require("../util")
const { validateToken, adminCheck } = require("../middlewares/auth")

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
        role: ["admin"],
        password,
        isPasswordSet: true,
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

authenticationRouter.post(
  "/login",
  loginRules,
  validateRules,
  async (req, res) => {
    try {
      const { email, password } = req.body
      const user = await User.findOne({ email: email })
      if (!user) {
        return res.status(401).json({
          sucess: false,
          errors: {
            email: "Account not found.",
          },
        })
      }
      const isMatch = await bcrypt.compare(password, user.password)
      if (!isMatch) {
        return res.status(401).json({
          sucess: false,
          errors: {
            error: {
              password: "Wrong Password.",
            },
          },
        })
      }
      if (!user.isPasswordSet) {
        // password not set return special jwt with flow
        let specialToken = jwt.sign(
          {
            userId: user._id,
            flow: "SET_PASSWORD",
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "15m",
          }
        )

        return res.status(200).json({
          sucess: true,
          specialToken,
          flow: "SET_PASSSWORD",
        })
      }
      // user have set password already so give normal token
      let token = jwt.sign(
        { userId: user._id, companyId: user.companyId },
        process.env.JWT_SECRET,
        {
          expiresIn: "9h",
        }
      )
      return res.status(200).json({
        sucess: true,
        token,
        flow: "NORMAL_LOGIN",
      })
    } catch (e) {
      errorHandlerFunction("Error during login.", e, res)
    }
  }
)

authenticationRouter.post(
  "/setup-password",
  setupPasswordRules,
  validateRules,
  async (req, res) => {
    try {
      const { specialToken, password } = req.body
      const decoded = jwt.verify(specialToken, process.env.JWT_SECRET)
      if (!decoded.flow == "SET_PASSWORD") {
        return res.status(401).json({
          sucess: false,
          errors: {
            error: "Some error during seting password, try agian",
          },
        })
      }
      let user = await User.findById(decoded.userId)
      if (!user) {
        return res.status(401).json({
          sucess: false,
          errors: {
            error: "Some error during seting password, try agian",
          },
        })
      }
      user.password = password
      user.isPasswordSet = true
      await user.save()
      jwt.sign(
        { userId: user._id, companyId: user.companyId },
        process.env.JWT_SECRET,
        { expiresIn: "9h" }
      )
      return res.status(201).json({
        sucess: true,
        message: "Password set successfully",
        token,
      })
    } catch (e) {
      errorHandlerFunction(
        "Some error during seting password, try agian",
        e,
        res
      )
    }
  }
)

authenticationRouter.post("/check-token", validateToken,async (req,res)=>{
  return res.status(200).json({
    sucess: true,
    message: "Token is valid."
  })
})

authenticationRouter.post("/check-admin",validateToken,adminCheck,async(req,res)=>{
  return res.status(200).json({
    sucess: true,
    message: "user is admin."
  })
})

module.exports = authenticationRouter
