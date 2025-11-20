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

adminRouter.get("/get-teams",validateToken,adminCheck,async (req,res)=>{
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 5;

    if (page < 1) page = 1;
    if (limit > 100) limit = 100;

    console.log("company id:-",req.company._id)

    let totalTeams = await Team.countDocuments({companyId: req.company._id, isDeleted: false})
    let noOfPages = Math.ceil((totalTeams/limit))

    let skip = (page-1)  * limit

    const foundTeams = await Team.find({companyId: req.company._id, isDeleted: false},{
      isDeleted: 0,
      __v: 0,
      companyId: 0,
      createdAt: 0,
      updatedAt: 0
    }).sort({createdAt: -1}).skip(skip).limit(limit).populate("managerId","fullName email")

    return res.status(200).json({
      sucess: true,
      teams: foundTeams,
      totalTeams,
      noOfPages,
    })


  } catch (err) {
    return res.status(400).json({
      success: false,
      errors: {
        error: err.message || "Error while getting teams."
      }
    })
  }
})

module.exports = adminRouter
