const express = require("express")
const { validateToken } = require("../middlewares/auth")
const managerController = require("../controllers/manager.controller")

const meetingRouter = express.Router()

meetingRouter.get(
  "/get-live-qa-data",
  validateToken,
  managerController.getLiveQaData
)
