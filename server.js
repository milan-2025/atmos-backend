const express = require("express")
const dotenv = require("dotenv")
const mongoose = require("mongoose")
const authenticationRouter = require("./routes/authentication.routes")
const cors = require("cors")
const adminRouter = require("./routes/admin.routes")
dotenv.config()
const { sendEmail } = require("./util")
// const { sendTestEmail } = require("./sentTestmail")

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

app.use(cors())
app.use(express.json())
app.use("/api/authentication/", authenticationRouter)
app.use("/api/admin/", adminRouter)
app.post("/send-email", async (req, res) => {
  sendEmail("milansinghdav@gmail.com", "Test Subject", "Test", { value: 123 })
  // sendTestEmail()
  return res.status(200).json({ message: "request-reached" })
})
