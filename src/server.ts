import express from "express"
import { Server } from "socket.io"
import { createServer } from "http"
import cors from "cors"

import { Config } from "./config"
import socket from "./socket"

const app = express()
app.use(cors())

const PORT = process.env.PORT || 3001

const { uri } = Config

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: uri,
    credentials: true,
  },
})

app.get("/", (req, res) => {
  res.send("POP CHAT SERVER: Up and Running")
})

httpServer.listen(PORT, () => {
  console.log("Server is listening to " + PORT), socket({ io })
})

module.exports = httpServer
