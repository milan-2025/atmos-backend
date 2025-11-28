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
}

module.exports = meetingController
