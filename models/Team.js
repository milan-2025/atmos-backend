const mongooose = require("mongoose")

const teamSchema = new mongooose.Schema(
  {
    teamName: {
      type: String,
      required: true,
      unique: true,
    },
    size: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: "",
    },
    companyId: {
      type: mongooose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    managerId: {
      type: mongooose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongooose.model("Team", teamSchema)
