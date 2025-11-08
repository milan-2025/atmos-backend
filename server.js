const express = require("express")
const dotenv = require("dotenv")
const mongoose = require("mongoose")

dotenv.config()

const app = express()

const port = process.env.PORT
const connectionUri = process.env.MONGO_URI

mongoose
  .connect(connectionUri)
  .then(() => {
    console.log("connected to db.")
    app.listen(port, () => {
      console.log("server started on port " + port)
    })
  })
  .catch((err) => {
    console.log("error while connecting to server and db", err)
  })
