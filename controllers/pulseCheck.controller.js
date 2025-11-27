const Workload = require("../models/Workload")

const { errorHandlerFunction } = require("../util")

const pulseCheckController = {
  addPulse: async (req, res) => {
    try {
      const timezone = req.headers["x-timezone"] || "UTC"
      const existingWorkloads = await Workload.find({
        userId: req.user._id,
        teamId: req.user.teamId,
        companyId: req.company._id,
      }).sort({
        createdAt: -1,
      })

      if (existingWorkloads.length > 0) {
        const lastSubmitDate =
          existingWorkloads[0].createdAt.toLocaleDateString("en-CA", {
            timezone,
          })
        const now = new Date().toLocaleDateString("en-CA", { timezone })

        //if already submitted for the day send error
        if (now == lastSubmitDate) {
          return res.status(400).json({
            success: false,
            errors: {
              workloadError: "Already submitted for today.",
            },
          })
        }
      }

      // now create a new workload

      let newWorkloadDoc = new Workload({
        userId: req.user._id,
        teamId: req.user.teamId,
        pulseResponse: req.body.pulseResponse,
        companyId: req.company._id,
      })

      await newWorkloadDoc.save()
      // io emit new pulse added to change cart data
      return res.status(201).json({
        success: true,
        message: "Pulse check done.",
      })
    } catch (e) {
      errorHandlerFunction("Error while adding pulse check", e, res)
    }
  },

  checkCanAddPulse: async (req, res) => {
    try {
      const timezone = req.headers["x-timezone"] || "UTC"
      const existingWorkloads = await Workload.find({
        userId: req.user._id,
        teamId: req.user.teamId,
        companyId: req.company._id,
      }).sort({
        createdAt: -1,
      })

      if (existingWorkloads.length == 0) {
        return res.status(200).json({
          success: true,
          message: "No pulse added till now",
        })
      }

      const lastSubmitDate = existingWorkloads[0].createdAt.toLocaleDateString(
        "en-CA",
        { timezone }
      )
      const now = new Date().toLocaleDateString("en-CA", { timezone })
      if (lastSubmitDate == now) {
        return res.status(400).json({
          success: false,
          errors: {
            error: "Already Added for today",
          },
        })
      }

      return res.status(200).json({
        success: true,
        message: "can add pulse check",
      })
    } catch (e) {
      errorHandlerFunction("error while checking can add pulse", e, res)
    }
  },

  getPulseChartData: async (req, res) => {
    try {
      const existingWorkloads = await Workload.find(
        {
          userId: req.user._id,
          teamId: req.user.teamId,
          companyId: req.company._id,
        },
        {
          createdAt: 1,
          _id: 1,
          pulseResponse: 1,
        }
      )
        .sort({
          createdAt: -1,
        })
        .limit(100)

      return res.status(200).json({
        success: true,
        workloads: existingWorkloads,
      })
    } catch (error) {
      errorHandlerFunction("error while getting response", error, res)
    }
  },
}

module.exports = pulseCheckController
