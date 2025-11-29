const Team = require("../models/Team")
const User = require("../models/User")
const { sendEmail, generateTemporaryPassword } = require("../util")
const adminController = {
  createTeam: async (req, res) => {
    try {
      let { teamName, description = "" } = req.body
      let existingTeam = await Team.find({ teamName: teamName })
      if (existingTeam.length > 0) {
        return res.status(401).json({
          sucess: false,
          errors: {
            teamName: `Team with name ${teamName} already exist.`,
          },
        })
      }
      let newTeamDoc = new Team({
        teamName,
        description,
        companyId: req.company._id,
      })
      let newTeam = await newTeamDoc.save()
      return res.status(201).json({
        success: true,
        message: "Team created.",
      })
    } catch (e) {
      console.log("Error while creating team.", e)
      return res.status(401).json({
        sucess: false,
        errors: {
          error: e.message || "Error while creating team.",
        },
      })
    }
  },

  getTeams: async (req, res) => {
    try {
      let page = parseInt(req.query.page) || 1
      let limit = parseInt(req.query.limit) || 5

      if (page < 1) page = 1
      if (limit > 100) limit = 100

      console.log("company id:-", req.company._id)

      let totalTeams = await Team.countDocuments({
        companyId: req.company._id,
        isDeleted: false,
      })
      let noOfPages = Math.ceil(totalTeams / limit)

      let skip = (page - 1) * limit

      const foundTeams = await Team.find(
        { companyId: req.company._id, isDeleted: false },
        {
          isDeleted: 0,
          __v: 0,
          companyId: 0,
          createdAt: 0,
          updatedAt: 0,
        }
      )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("managerId", "fullName email")

      return res.status(200).json({
        sucess: true,
        teams: foundTeams,
        totalTeams,
        noOfPages,
      })
    } catch (err) {
      return res.status(400).json({
        success: false,
        errors: {
          error: err.message || "Error while getting teams.",
        },
      })
    }
  },

  addMember: async (req, res) => {
    try {
      const { fullName, email, teamId, teamName } = req.body
      const role = ["employee"]
      let companyCheck = await User.findOne({
        email: email,
      })
      if (companyCheck) {
        if (companyCheck.companyId.toString() != req.company._id.toString()) {
          return res.status(401).json({
            success: false,
            errors: {
              email: `User already present in another company.`,
            },
          })
        }
      }
      // check if user already in same  team
      let teamCheck = await User.findOne({
        email: email,
        teamId: teamId,
      })
      if (teamCheck) {
        return res.status(400).json({
          success: false,
          errors: {
            email: `${email} is already present in ${teamName}`,
          },
        })
      }
      let existingUser = await User.findOne({
        email: email,
        companyId: req.company._id,
      }).populate("teamId", "teamName")
      if (existingUser) {
        // if already in another team get teamName and send back as error already existing in team
        if (existingUser.teamId) {
          return res.status(400).json({
            success: false,
            errors: {
              email: `${email} is already present in ${existingUser.teamId.teamName}`,
            },
          })
        }
        // else add user to the team and send mail
        existingUser.teamId = teamId
        await existingUser.save()
        // find team and update size
        let updatedTeam = await Team.findOneAndUpdate(
          {
            _id: teamId,
          },
          {
            $inc: {
              size: 1,
            },
          },
          {
            new: true,
          }
        )

        await sendEmail(
          email,
          `Congratulations you have been added to team- ${teamName}.`,
          "ExistingUser",
          { fullName: fullName, teamName: teamName },
          res
        )
      } else {
        // generate a temporaryPassword
        const tempPassword = generateTemporaryPassword()
        // create new user
        let user = new User({
          fullName,
          email,
          role,
          teamId,
          companyId: req.company._id,
          password: tempPassword,
        })

        await user.save()
        let updatedTeam = await Team.findOneAndUpdate(
          {
            _id: teamId,
          },
          {
            $inc: {
              size: 1,
            },
          },
          {
            new: true,
          }
        )

        await sendEmail(
          email,
          `Congratulations you have been added to team- ${teamName}.`,
          "NewUser",
          {
            fullName: fullName,
            teamName: teamName,
            email: email,
            tempPassword: tempPassword,
          },
          res
        )
      }
    } catch (err) {
      console.log("error while adding member", err)
      return res.status(500).json({
        success: false,
        errors: {
          error: err.message || "Error while addiing member.",
        },
      })
    }
  },

  getMembers: async (req, res) => {
    const searchQuery = req.query.q
    const teamId = req.query.teamId
    if (!teamId) {
      return res.status(400).json({
        success: false,
        errors: {
          error: "no team id provided",
        },
      })
    }
    if (!searchQuery) {
      // Return an empty array if no query is provided (or all items, depending on preference)
      return res.status(200).json({
        membersFound: [],
      })
    }

    try {
      // 2. Construct a Regular Expression for prefix matching
      // '^' ensures the search starts at the beginning of the string.
      // 'i' makes the search case-insensitive.
      const regex = new RegExp(`^${searchQuery}`, "i")

      // 3. Query Mongoose
      // Find documents where the 'name' field matches the regex.
      // Limit to 10 suggestions for a standard autocomplete experience.
      const suggestions = await User.find({ fullName: regex, teamId: teamId })
        .select("fullName _id email teamId") // Only return the name and category fields
        .limit(10)

      // 4. Send the results
      return res.status(200).json({
        membersFound: suggestions,
      })
    } catch (error) {
      console.error("Search error:", error)
      res.status(500).json({ message: "Internal server error during search." })
    }
  },

  assignManager: async (req, res) => {
    // if member already assigned return error member already asigned
    // format -- {
    // errors: {
    //   assignManager: 'member already assigned'
    // }}
    //
    //
    //
    // body will have userId and teamid of the member to be added
    // find the user update his role by inserting "manager" in array
    // assign that userId to managerId of team
    // save all and return staus 201
  },

  removeMember: async (req, res) => {
    // body will have userid of the member
    // find member and make it's teamId null
    // if member is a manager make Team's managerId null then make it's teamID null
    // send remove Member email
    // decrement team size by 1
  },

  deleteTeam: async (req, res) => {
    // if team size is not 0 return error remove all members first
    //------
    // body will have team id set isDeleted to true
  },
}

module.exports = adminController

/*
const Team = require("../models/Team");
const User = require("../models/User");
const { sendEmail, generateTemporaryPassword } = require("../util");

const adminController = {
  createTeam: async (req, res) => {
    try {
      let { teamName, description = "" } = req.body;

      let existingTeam = await Team.find({ teamName: teamName });
      if (existingTeam.length > 0) {
        return res.status(401).json({
          sucess: false,
          errors: {
            teamName: `Team with name ${teamName} already exist.`,
          },
        });
      }

      let newTeamDoc = new Team({
        teamName,
        description,
        companyId: req.company._id,
      });

      await newTeamDoc.save();

      return res.status(201).json({
        success: true,
        message: "Team created.",
      });
    } catch (e) {
      console.log("Error while creating team.", e);
      return res.status(401).json({
        sucess: false,
        errors: {
          error: e.message || "Error while creating team.",
        },
      });
    }
  },

  getTeams: async (req, res) => {
    try {
      let page = parseInt(req.query.page) || 1;
      let limit = parseInt(req.query.limit) || 5;

      if (page < 1) page = 1;
      if (limit > 100) limit = 100;

      let totalTeams = await Team.countDocuments({
        companyId: req.company._id,
        isDeleted: false,
      });

      let noOfPages = Math.ceil(totalTeams / limit);
      let skip = (page - 1) * limit;

      const foundTeams = await Team.find(
        { companyId: req.company._id, isDeleted: false },
        {
          isDeleted: 0,
          __v: 0,
          companyId: 0,
          createdAt: 0,
          updatedAt: 0,
        }
      )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("managerId", "fullName email");

      return res.status(200).json({
        sucess: true,
        teams: foundTeams,
        totalTeams,
        noOfPages,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        errors: {
          error: err.message || "Error while getting teams.",
        },
      });
    }
  },

  addMember: async (req, res) => {
    try {
      const { fullName, email, teamId, teamName } = req.body;
      const role = ["employee"];

      let companyCheck = await User.findOne({ email: email });

      if (companyCheck) {
        if (companyCheck.companyId.toString() != req.company._id.toString()) {
          return res.status(401).json({
            success: false,
            errors: {
              email: `User already present in another company.`,
            },
          });
        }
      }

      // check if user already in same team
      let teamCheck = await User.findOne({
        email: email,
        teamId: teamId,
      });

      if (teamCheck) {
        return res.status(400).json({
          success: false,
          errors: {
            email: `${email} is already present in ${teamName}`,
          },
        });
      }

      let existingUser = await User.findOne({
        email: email,
        companyId: req.company._id,
      }).populate("teamId", "teamName");

      if (existingUser) {
        if (existingUser.teamId) {
          return res.status(400).json({
            success: false,
            errors: {
              email: `${email} is already present in ${existingUser.teamId.teamName}`,
            },
          });
        }

        existingUser.teamId = teamId;
        await existingUser.save();

        await Team.findOneAndUpdate(
          { _id: teamId },
          { $inc: { size: 1 } },
          { new: true }
        );

        await sendEmail(
          email,
          `Congratulations you have been added to team- ${teamName}.`,
          "ExistingUser",
          { fullName: fullName, teamName: teamName },
          res
        );
      } else {
        const tempPassword = generateTemporaryPassword();

        let user = new User({
          fullName,
          email,
          role,
          teamId,
          companyId: req.company._id,
          password: tempPassword,
        });

        await user.save();

        await Team.findOneAndUpdate(
          { _id: teamId },
          { $inc: { size: 1 } },
          { new: true }
        );

        await sendEmail(
          email,
          `Congratulations you have been added to team- ${teamName}.`,
          "NewUser",
          {
            fullName: fullName,
            teamName: teamName,
            email: email,
            tempPassword: tempPassword,
          },
          res
        );
      }
    } catch (err) {
      console.log("error while adding member", err);
      return res.status(500).json({
        success: false,
        errors: {
          error: err.message || "Error while adding member.",
        },
      });
    }
  },

  getMembers: async (req, res) => {},

  // ✔ IMPLEMENTED EXACTLY AS PER YOUR COMMENTS
  assignManager: async (req, res) => {
    try {
      const { userId, teamId } = req.body;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(400).json({
          errors: { assignManager: "User not found" },
        });
      }

      // if member already assigned return error
      if (user.role.includes("manager")) {
        return res.status(400).json({
          errors: { assignManager: "member already assigned" },
        });
      }

      // update role → insert "manager"
      user.role.push("manager");
      await user.save();

      // assign userId to team.managerId
      await Team.findByIdAndUpdate(teamId, {
        managerId: userId,
      });

      return res.status(201).json({
        success: true,
        message: "Manager assigned successfully",
      });
    } catch (err) {
      return res.status(500).json({
        errors: { assignManager: err.message },
      });
    }
  },

  // ✔ IMPLEMENTED EXACTLY AS PER YOUR COMMENTS
  removeMember: async (req, res) => {
    try {
      const { userId, teamId } = req.body;

      // find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(400).json({
          errors: { removeMember: "User not found" },
        });
      }

      const team = await Team.findById(teamId);

      // if member is manager make team.managerId null
      if (team.managerId?.toString() === userId.toString()) {
        team.managerId = null;
      }

      // make user's team null
      user.teamId = null;

      // decrement team size by 1
      team.size -= 1;

      await user.save();
      await team.save();

      // send email
      await sendEmail(
        user.email,
        `You have been removed from team ${team.teamName}.`,
        "RemoveMember",
        {
          fullName: user.fullName,
          teamName: team.teamName,
        },
        res
      );

      return res.status(200).json({
        success: true,
        message: "Member removed successfully",
      });
    } catch (err) {
      return res.status(500).json({
        errors: { removeMember: err.message },
      });
    }
  },

  // ✔ IMPLEMENTED EXACTLY AS PER YOUR COMMENTS
  deleteTeam: async (req, res) => {
    try {
      const { teamId } = req.body;

      const team = await Team.findById(teamId);

      // must remove all members first
      if (team.size !== 0) {
        return res.status(400).json({
          errors: { deleteTeam: "Remove all members first" },
        });
      }

      // mark team as deleted
      team.isDeleted = true;
      await team.save();

      return res.status(200).json({
        success: true,
        message: "Team deleted successfully",
      });
    } catch (err) {
      return res.status(500).json({
        errors: { deleteTeam: err.message },
      });
    }
  },
};

module.exports = adminController;
*/
