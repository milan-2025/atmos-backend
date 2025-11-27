const mongoose = require("mongoose")

const workloadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pulseResponse: {
      type: String,
      required: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
  },
  { timestamps: true }
)

workloadSchema.statics.getStreak = async function (
  userId,
  teamId,
  companyId,
  userTimezone
) {
  // Default to UTC if no timezone is provided
  const timeZone = userTimezone || "UTC"

  const logs = await this.find({ userId, teamId, companyId })
    .sort({ createdAt: -1 })
    .select("createdAt")

  if (!logs.length) return 0

  // 2. Helper to convert Date object to "YYYY-MM-DD" in specific Timezone
  // We use 'en-CA' because it always outputs YYYY-MM-DD format
  const getLocalDate = (dateObj) => {
    return dateObj.toLocaleDateString("en-CA", { timeZone })
  }

  // 3. Create a unique list of LOCAL dates
  const uniqueLocalDates = [
    ...new Set(logs.map((log) => getLocalDate(log.createdAt))),
  ]

  // 4. Calculate "Today" and "Yesterday" in the USER'S timezone
  const now = new Date()
  const localToday = getLocalDate(now)

  // To get local yesterday, we subtract 24h, then convert to string
  const yesterdayDate = new Date(now)
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const localYesterday = getLocalDate(yesterdayDate)

  // 5. Check if the streak is alive
  // The most recent entry must be either Today OR Yesterday
  if (
    uniqueLocalDates[0] !== localToday &&
    uniqueLocalDates[0] !== localYesterday
  ) {
    return 0
  }

  // 6. Iterate backwards
  let streak = 0
  let checkDate = new Date() // Start with "Now"

  // If the last entry was yesterday, we adjust our starting check point back by 1 day
  if (uniqueLocalDates[0] === localYesterday) {
    checkDate.setDate(checkDate.getDate() - 1)
  }

  for (const dateString of uniqueLocalDates) {
    const expectedDateString = getLocalDate(checkDate)

    if (dateString === expectedDateString) {
      streak++
      // Move the check date back 1 day for the next iteration
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break // Gap found, stop counting
    }
  }

  return streak
}

module.exports = mongoose.model("Workload", workloadSchema)
