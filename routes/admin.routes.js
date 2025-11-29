const express = require("express")
const { validateToken, adminCheck } = require("../middlewares/auth")
// const Team = require("../models/Team")
const { createTeamRules, validateRules } = require("../middlewares/validators")
// const User = require("../models/User")
// const { sendEmail, generateTemporaryPassword } = require("../util")
const adminController = require("../controllers/admin.controller")

const adminRouter = express.Router()

adminRouter.post(
  "/create-team",
  validateToken,
  adminCheck,
  createTeamRules,
  validateRules,
  adminController.createTeam
)

adminRouter.get(
  "/get-teams",
  validateToken,
  adminCheck,
  adminController.getTeams
)

adminRouter.post(
  "/add-member",
  validateToken,
  adminCheck,
  adminController.addMember
)

adminRouter.get(
  "/get-members",
  validateToken,
  adminCheck,
  adminController.getMembers
)

adminRouter.post(
  "/assign-manager",
  validateToken,
  adminCheck,
  adminController.assignManager
)

module.exports = adminRouter
