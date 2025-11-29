const QaMeeting = require("../models/QaMeeting.js")
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
}

module.exports = managerController
