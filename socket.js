let io
const { Server } = require("socket.io")

module.exports = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
      },
    })
    return io
  },

  getIO: () => {
    if (!io) {
      let error = new Error("IO not intialized.")
      throw error
    }
    return io
  },
}
