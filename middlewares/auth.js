const jwt = require("jsonwebtoken")
const Company = require("../models/Company")
const User = require("../models/User")

const validateToken = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "")
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    let company = await Company.findById(decoded.companyId)
    if (!company) {
      return res
        .status(401)
        .json({ sucess: false, errors: { error: "token validation error" } })
    }
    let user = await User.findById(decoded.userId)
    if (!user) {
      return res.status(401).json({
        sucess: false,
        errors: {
          error: "token validation error",
        },
      })
    }
    req.user = user
    req.company = company
    next()
  } catch (e) {
    console.log("error while vaildateToken", e)
    return res.status(401).json({
      sucess: false,
      errors: {
        error: "token validation error",
      },
    })
  }
}

module.exports = {
  validateToken,
}
