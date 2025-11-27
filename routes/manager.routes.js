const express = require("express")
const { validateToken } = require("../middlewares/auth")
const managerController = require("../controllers/manager.controller")

const managerRouter = express.Router()

managerRouter.post(
  "/start-live-qa",
  validateToken,
  managerController.startLiveQa
)

module.exports = managerRouter
