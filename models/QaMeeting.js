const mongoose = require("mongoose")

const qaMeetingSchema = new mongoose.Schema({
  meetingName: {
    type: String,
    unique: true,
    required: true,
  },
  members: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    default: [],
  },
  questions: {
    type: [],
    default: [],
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
  isActive: {
    type: Boolean,
    required: true,
  },
  hostEmail: {
    type: String,
    required: true,
  },
})

module.exports = mongoose.model("QaMeeting", qaMeetingSchema)
