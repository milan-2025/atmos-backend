const express = require("express")
const { validateToken } = require("../middlewares/auth")
// const User = require("../models/User")
// const Kudo = require("../models/Kudo")
// const { errorHandlerFunction } = require("../util.js")
const kudoController = require("../controllers/kudo.controller.js")
const kudoRouter = express.Router()

kudoRouter.post("/send-kudo", validateToken, kudoController.sendKudo)

kudoRouter.get("/get-kudos", validateToken, kudoController.getKudos)

module.exports = kudoRouter
