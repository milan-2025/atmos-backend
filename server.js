const express = require("express")
const http = require("http")
const dotenv = require("dotenv")
const mongoose = require("mongoose")
const authenticationRouter = require("./routes/authentication.routes")
const cors = require("cors")
const adminRouter = require("./routes/admin.routes")
dotenv.config()
const { sendEmail } = require("./util")
const kudoRouter = require("./routes/kudo.routes.js")
const pulseCheckRouter = require("./routes/pulseCheck.routes.js")
const managerRouter = require("./routes/manager.routes.js")
const meetingRouter = require("./routes/meeting.routes.js")
// const { sendTestEmail } = require("./sentTestmail")

const app = express()
const server = http.createServer(app)

const port = process.env.PORT
const connectionUri = process.env.MONGO_URI

mongoose
  .connect(connectionUri)
  .then(() => {
    console.log("connected to db.")
    const io = require("./socket.js").init(server)
    io.on("connection", (socket) => {
      console.log("conected to client")
    })
    server.listen(port, "0.0.0.0", () => {
      console.log("server started on port with socket.io " + port)
    })
  })
  .catch((err) => {
    console.log("error while connecting to server and db", err)
  })

app.use(cors())
app.use(express.json())
app.use("/api/authentication/", authenticationRouter)
app.use("/api/admin/", adminRouter)
app.use("/api/admin/kudos", kudoRouter)
app.use("/api/pulsecheck", pulseCheckRouter)
app.use("/api/manager/", managerRouter)
app.use("/api/meeting/", meetingRouter)

// app.post("/send-email", async (req, res) => {
//   sendEmail("milansinghdav@gmail.com", "Test Subject", "Test", { value: 123 })
//   // sendTestEmail()
//   return res.status(200).json({ message: "request-reached" })
// })
