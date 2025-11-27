const nodemailer = require("nodemailer")
const hbs =
  require("nodemailer-express-handlebars").default ||
  require("nodemailer-express-handlebars")
const path = require("path")
// const dotenv = require("dotenv")
// dotenv.config()
const errorHandlerFunction = (msg, e, res) => {
  console.log(msg, e)
  return res.status(401).json({
    success: false,
    errors: {
      error: e.message || msg,
    },
  })
}

const transporter = nodemailer.createTransport({
  // Using the 'gmail' service automatically sets host, port, and security
  host: "smtp.gmail.com", // Explicit host
  port: 465, // Standard secure port
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    // The App Password is used as the 'pass'
    pass: process.env.EMAIL_PASS,
  },
})

const hbsOptions = {
  viewEngine: {
    extName: ".hbs",
    defaultLayout: false,
  },
  viewPath: path.resolve("./views"),
  extName: ".hbs",
}

transporter.use("compile", hbs(hbsOptions))

const sendEmail = async (to, subject, template, context, res) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      template,
      context,
    }

    // Send email options using the transporter
    let info = await transporter.sendMail(mailOptions)
    console.log("\n✉️ Message sent successfully!")
    console.log("Message ID: %s", info.messageId)
    return res.status(200).json({
      success: true,
      message: "Member added",
    })
  } catch (error) {
    console.error("\n❌ FAILED TO SEND EMAIL:")
    console.error(error.response || error)
    return res.status(500).json({
      success: false,
      errors: {
        error: error.message || "Some error while adding user.",
      },
    })
  }
}

function generateTemporaryPassword(length = 12) {
  // Define the character sets to use
  const charset = {
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    numbers: "0123456789",
    symbols: "@#$",
  }

  // Combine all character sets for general use
  const allChars = Object.values(charset).join("")

  let password = ""

  // 1. Ensure the password contains at least one character from each set
  // This makes the password meet common complexity requirements
  const requiredChars = [
    charset.lowercase,
    charset.uppercase,
    charset.numbers,
    charset.symbols,
  ]

  for (const set of requiredChars) {
    // Pick a random character from the current required set
    const randomChar = set.charAt(Math.floor(Math.random() * set.length))
    password += randomChar
  }

  // 2. Fill the remaining length with random characters from the combined set
  for (let i = password.length; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length)
    password += allChars[randomIndex]
  }

  // 3. Shuffle the password to ensure the required characters are not just at the start
  password = password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("")

  return password
}

module.exports = {
  errorHandlerFunction,
  sendEmail,
  generateTemporaryPassword,
}
