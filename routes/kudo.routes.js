const express = require("express")
const { validateToken } = require("../middlewares/auth")
const User = require("../models/User")
const Kudo = require("../models/Kudo")
const { errorHandlerFunction } = require("../util.js")
const kudoRouter = express.Router()

kudoRouter.post("/send-kudo", validateToken, async (req, res) => {
  try {
    let io = require("../socket.js").getIO()
    const { to, message, visibility } = req.body
    const toUser = await User.findOne({
      email: to,
      companyId: req.company._id,
    })
    if (to == req.user.email) {
      return res.status(400).json({
        success: false,
        errors: {
          to: "Can't send a kudo to yourself.",
        },
      })
    }
    if (!toUser) {
      return res.status(400).json({
        success: false,
        errors: {
          to: "User not found or not registerd in your company.",
        },
      })
    }
    let newKudo = new Kudo({
      from: req.user._id,
      to: toUser._id,
      message,
      visibility,
      company: req.company._id,
    })
    let savedKudo = await newKudo.save()

    if (visibility == "Public") {
      io.emit("kudo_added", {
        kudoData: {
          from: req.user.email,
          to: toUser.email,
          message: savedKudo.message,
          createdAt: newKudo.createdAt,
          _id: savedKudo._id,
        },
      })
    }
    if (visibility == "Private") {
      io.emit("kudo_added", {
        kudoData: {
          from: "Anonymous Employee",
          to: toUser.email,
          message: savedKudo.message,
          createdAt: newKudo.createdAt,
          _id: savedKudo._id,
        },
      })
    }
    return res.status(201).json({
      success: true,
      message: "Sent Successfully!!!",
    })
  } catch (e) {
    errorHandlerFunction("Some error occured while sending kudo", e, res)
  }
})

kudoRouter.get("/get-kudos", validateToken, async (req, res) => {
  try {
    let kudos = await Kudo.find({
      company: req.company._id,
    })
      .sort({
        createdAt: -1,
      })
      .limit(5)
      .populate("to", "email")
      .populate("from", "email")

    let formattedKudos = kudos.map((kudo) => {
      let obj = {
        _id: kudo._id,
        to: kudo.to.email,
        message: kudo.message,
        createdAt: kudo.createdAt,
      }
      if (kudo.visibility == "Public") {
        obj.from = kudo.from.email
      }
      if (kudo.visibility == "Private") {
        obj.from = "Anonymous Employee"
      }
      return obj
    })

    return res.status(200).json({
      success: true,
      kudos: formattedKudos,
    })
  } catch (e) {
    console.log("err, ", e)
    errorHandlerFunction("Error while getting kudos", e, res)
  }
})

module.exports = kudoRouter
