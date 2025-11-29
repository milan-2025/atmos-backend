const QaMeeting = require("../models/QaMeeting")
const { errorHandlerFunction } = require("../util")

const meetingController = {
  askQuestion: async (req, res) => {
    try {
      let teamId = req.user.teamId
      let existingMeeting = await QaMeeting.findOne({
        teamId: teamId,
      })
      if (!existingMeeting) {
        return res.status(401).json({
          success: false,
          errors: {
            error: "Meeting not found..!",
          },
        })
      }
      let question = {
        question: req.body.question,
        upvotes: req.body.upvotes,
        createdAt: new Date().toISOString(),
      }
      existingMeeting.questions.unshift(question)

      await existingMeeting.save()
      let io = require("../socket").getIO()
      io.emit("question_asked_" + teamId.toString(), {
        question: question,
      })
      return res.status(201).json({
        success: true,
        message: "question asked",
      })
    } catch (error) {
      errorHandlerFunction("error while asking question....!!!", error, res)
    }
  },
  isQaMeetingActive: async (req, res) => {
    try {
      let teamId = req.user.teamId
      let existingMeeting = await QaMeeting.findOne({
        teamId: teamId,
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
      return res.status(200).json({
        success: true,
        message: "Meeting is active.",
      })
    } catch (error) {
      errorHandlerFunction("error while checking meeting status", error, res)
    }
  },

  userLeftMeeting: async (req, res) => {
    try {
      let meeting = await QaMeeting.findOne({
        teamId: req.user.teamId,
      })
      if (!meeting) {
        return res.status(500).json({
          success: false,
          errors: {
            error: "meeting not found",
          },
        })
      }
      let index = meeting.members.findIndex((item) => {
        return item._id.toString() == req.user._id.toString()
      })
      console.log("index--", index)
      if (index >= 0) {
        meeting.members.splice(index, 1)
        await meeting.save()
        let io = require("../socket").getIO()
        let tId = req.user.teamId.toString()
        io.emit("user_left_" + tId, {
          name: req.user.fullName,
          email: req.user.email,
          teamId: tId,
        })
      }
      return res.status(200).json({ success: true, message: "user left" })
    } catch (err) {
      errorHandlerFunction("error while user left", err, res)
    }
  },
}

module.exports = meetingController
