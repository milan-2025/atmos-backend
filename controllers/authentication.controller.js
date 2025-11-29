const Company = require("../models/Company")
const User = require("../models/User")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const { errorHandlerFunction } = require("../util")
const QaMeeting = require("../models/QaMeeting")

const authenticationController = {
  registerCompany: async (req, res) => {
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
        name: newUser.fullName,
        email: newUser.email,
        teamId: newUser.teamId || "",
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
  },
  login: async (req, res) => {
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
            password: "Wrong Password.",
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
          token: specialToken,
          flow: "SET_PASSWORD",
          name: "",
          teamId: "",
          email: "",
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
        name: user.fullName,
        teamId: user.teamId,
        email: user.email,
      })
    } catch (e) {
      errorHandlerFunction("Error during login.", e, res)
    }
  },
  setupPassword: async (req, res) => {
    try {
      const { specialToken, password } = req.body
      const decoded = jwt.verify(specialToken, process.env.JWT_SECRET)
      if (decoded.flow != "SET_PASSWORD") {
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
      let savedUser = await user.save()
      let token = jwt.sign(
        { userId: user._id, companyId: user.companyId },
        process.env.JWT_SECRET,
        { expiresIn: "9h" }
      )
      return res.status(201).json({
        sucess: true,
        message: "Password set successfully",
        token,
        name: savedUser.fullName,
        email: savedUser.email,
        teamId: savedUser.teamId,
      })
    } catch (e) {
      errorHandlerFunction(
        "Some error during seting password, try agian",
        e,
        res
      )
    }
  },
  checkSpecialToken: async (req, res) => {
    try {
      const specialToken = req.header("Authorization").replace("Bearer ", "")
      const decoded = jwt.verify(specialToken, process.env.JWT_SECRET)
      if (decoded.flow != "SET_PASSWORD") {
        return res.status(401).json({
          sucess: false,
          errors: {
            error: "Some error during token validation, try agian",
          },
        })
      }
      let user = await User.findById(decoded.userId)
      if (!user) {
        return res.status(401).json({
          sucess: false,
          errors: {
            error: "Some error during token validation, try agian",
          },
        })
      }
      return res.status(200).json({
        sucess: true,
        meesage: "can proceed to set password",
      })
    } catch (err) {
      errorHandlerFunction(
        "Some error during token validation, try agian",
        err,
        res
      )
    }
  },
  checkToken: async (req, res) => {
    return res.status(200).json({
      sucess: true,
      message: "Token is valid.",
    })
  },
  checkAdmin: async (req, res) => {
    return res.status(200).json({
      sucess: true,
      message: "user is admin.",
    })
  },

  checkQaMeeting: async (req, res) => {
    try {
      const { ms } = req.body
      let teamId = req.user.teamId.toString()
      let existingMeeting = await QaMeeting.findOne({
        teamId: ms,
      })
      if (!existingMeeting) {
        return res.status(401).json({
          sucess: false,
          message: "UnAuthorized Access.",
        })
      }
      if (!existingMeeting.isActive) {
        return res.status(400).json({
          sucess: false,
          message: "Meeting is not active.",
        })
      }
      if (ms != teamId) {
        return res.status(401).json({
          sucess: false,
          message: "You are not allowed in meeting.",
        })
      }
      let io = require("../socket").getIO()
      let existingMembers = existingMeeting.members
      if (!existingMembers.includes(req.user._id.toString())) {
        existingMeeting.members.unshift(req.user._id)
        await existingMeeting.save()
      }
      io.emit("user_joined_" + teamId, {
        name: req.user.fullName,
        email: req.user.email,
        teamId: teamId,
      })
      return res.status(200).json({
        sucess: true,
        message: "You are allowed",
      })
    } catch (e) {
      errorHandlerFunction("error while checking Qa meeting", e, res)
    }
  },
}

module.exports = authenticationController
