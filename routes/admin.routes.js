const express = require("express")
const { validateToken, adminCheck } = require("../middlewares/auth")
const Team = require("../models/Team")
const { createTeamRules, validateRules } = require("../middlewares/validators")

const adminRouter = express.Router()

adminRouter.post(
  "/create-team",
  validateToken,
  adminCheck,
  createTeamRules,
  validateRules,
  async (req, res) => {
    try {
      let { teamName, description = "" } = req.body
      let existingTeam = await Team.find({ teamName: teamName })
      if (existingTeam.length > 0) {
        return res.status(401).json({
          sucess: false,
          errors: {
            teamName: `Team with name ${teamName} already exist.`,
          },
        })
      }
      let newTeamDoc = new Team({
        teamName,
        description,
        companyId: req.company._id,
      })
      let newTeam = await newTeamDoc.save()
      return res.status(201).json({
        success: true,
        message: "Team created.",
      })
    } catch (e) {
      console.log("Error while creating team.", e)
      return res.status(401).json({
        sucess: false,
        errors: {
          error: e.message || "Error while creating team.",
        },
      })
    }
  }
)

module.exports = adminRouter
