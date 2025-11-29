const express = require("express")
const { validateToken } = require("../middlewares/auth")
const managerController = require("../controllers/manager.controller")
const meetingController = require("../controllers/meeting.controller")

const meetingRouter = express.Router()

meetingRouter.get(
  "/get-live-qa-data",
  validateToken,
  managerController.getLiveQaData
)

meetingRouter.post(
  "/ask-question",
  validateToken,
  meetingController.askQuestion
)

meetingRouter.get(
  "/is-meeting-active",
  validateToken,
  meetingController.isQaMeetingActive
)

meetingRouter.post(
  "/user-left-meeting",
  validateToken,
  meetingController.userLeftMeeting
)

module.exports = meetingRouter
