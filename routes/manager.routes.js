const express = require("express")
const { validateToken } = require("../middlewares/auth")
const managerController = require("../controllers/manager.controller")

const managerRouter = express.Router()

managerRouter.post(
  "/start-live-qa",
  validateToken,
  managerController.startLiveQa
)

managerRouter.post("/end-live-qa", validateToken, managerController.endLiveQa)
managerRouter.get(
  "/pulse-pi-chart",
  validateToken,
  managerController.getWorkloadDashboardData
)

module.exports = managerRouter
