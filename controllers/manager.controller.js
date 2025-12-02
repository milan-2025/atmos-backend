const QaMeeting = require("../models/QaMeeting.js")
const Team = require("../models/Team.js")
const Workload = require("../models/Workload.js")
const { errorHandlerFunction } = require("../util.js")

const managerController = {
  startLiveQa: async (req, res) => {
    // start a meeting and emit a signal to all team members that meeting started

    // team id of manager
    try {
      const teamId = req.user.teamId.toString()

      let io = require("../socket.js").getIO()
      let mName = "meeting_" + teamId
      let meeting = await QaMeeting.findOne({
        meetingName: mName,
        teamId: req.user.teamId,
        companyId: req.company._id,
      })
      if (meeting) {
        meeting.isActive = true
        await meeting.save()
      }
      if (!meeting) {
        meeting = await QaMeeting.create({
          meetingName: mName,
          teamId: req.user.teamId,
          companyId: req.company._id,
          isActive: true,
          hostEmail: req.user.email,
        })
      }
      io.emit("meeting_started_" + teamId, {
        teamID: teamId,
        startedBy: req.user.email,
      })

      return res
        .status(200)
        .json({ message: "meeting started", ms: "meeting_started_" + teamId })
    } catch (error) {
      errorHandlerFunction("error while starting live QA", error, res)
    }
  },

  endLiveQa: async (req, res) => {
    try {
      const teamId = req.user.teamId

      let io = require("../socket.js").getIO()

      let meeting = await QaMeeting.findOne({
        teamId: req.user.teamId,
        companyId: req.company._id,
      })

      if (!meeting) {
        return res.status(400).json({
          success: false,
          errors: {
            error: "No meeting to end",
          },
        })
      }
      meeting.members = []
      meeting.questions = []
      meeting.isActive = false
      await meeting.save()

      io.emit("meeting_ended_" + teamId, {
        teamID: teamId,
      })
      return res.status(201).json({
        success: true,
        message: "meeting ended",
      })
    } catch (error) {
      errorHandlerFunction("error while ending live QA", error, res)
    }
  },
  getLiveQaData: async (req, res) => {
    try {
      let existingMeeting = await QaMeeting.findOne({
        teamId: req.user.teamId,
      }).populate("members", "email teamId fullName")
      console.log("existingMeeting--", existingMeeting)
      if (!existingMeeting) {
        return res.status(401).json({
          success: false,
          errors: {
            error: "meeting not found.",
          },
        })
      }
      return res.status(200).json({
        success: true,
        existingMeeting: existingMeeting,
      })
    } catch (err) {
      errorHandlerFunction("error while getting live Qa data", err, res)
    }
  },

  getWorkloadDashboardData: async (req, res) => {
    try {
      let teamId = req.user.teamId
      let team = await Team.findById(teamId)
      let totalMembers = team.size
      let firstWorkload = await Workload.find({
        teamId: teamId,
      })
        .sort({
          createdAt: 1,
        })
        .limit(1)

      let pastTimeStamp = new Date(firstWorkload[0].createdAt).getTime()
      let currentTime = Date.now()
      const msPerDay = 86400000
      const daysPassed = Math.floor((currentTime - pastTimeStamp) / msPerDay)
      let totWorkloads = totalMembers * daysPassed

      // let totalWorkloads = await Workload.countDocuments({
      //   teamId: teamId,
      // })

      let totalFeelingGood = await Workload.countDocuments({
        teamId: teamId,
        pulseResponse: "Feeling Good",
      })

      let totalGeetingBusy = await Workload.countDocuments({
        teamId: teamId,
        pulseResponse: "Getting Busy",
      })

      let totalOverwhelmed = await Workload.countDocuments({
        teamId: teamId,
        pulseResponse: "Overwhelmed",
      })

      let notResponded =
        totWorkloads - (totalFeelingGood + totalGeetingBusy + totalOverwhelmed)

      let fgPercentage =
        Number(Math.toFixed(totalFeelingGood / totWorkloads, 4)) * 100
      let gbPercentage =
        Number(Math.toFixed(totalGeetingBusy / totWorkloads, 4)) * 100

      let owPercentage =
        Number(Math.toFixed(totalOverwhelmed / totWorkloads, 4)) * 100

      let nrPercentage =
        Number(Math.toFixed(notResponded / totWorkloads, 4)) * 100

      return res.status(200).json({
        success: true,
        teamData: [
          {
            name: "Feeling Good",
            value: fgPercentage,
            color: "#10b981",
          },
          {
            name: "Getting Busy",
            value: gbPercentage,
            color: "#facc15",
          },
          {
            name: "Feeling Overwhelmed",
            value: owPercentage,
            color: "#ef4444",
          },
          // { name: "No Response", value: nrPercentage, color: "#e5e7eb" },
        ],
        totalMembers: totalMembers,
        totalWorkloads: totWorkloads,
      })
    } catch (err) {
      errorHandlerFunction(
        "error while getting workloads dashboard data",
        err,
        res
      )
    }
  },
}

module.exports = managerController
