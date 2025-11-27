const express = require("express")
const { validateToken } = require("../middlewares/auth")
const pulseCheckController = require("../controllers/pulseCheck.controller")

const pulseCheckRouter = express.Router()

pulseCheckRouter.post(
  "/add-pulse",
  validateToken,
  pulseCheckController.addPulse
)

pulseCheckRouter.get(
  "/can-add-pulse",
  validateToken,
  pulseCheckController.checkCanAddPulse
)

pulseCheckRouter.get(
  "/get-chart-data",
  validateToken,
  pulseCheckController.getPulseChartData
)

module.exports = pulseCheckRouter
