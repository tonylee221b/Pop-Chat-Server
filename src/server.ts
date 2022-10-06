import express from "express"
import { Server } from "socket.io"
import { createServer } from "http"
import cors from "cors"

import { Config } from "./config"
import socket from "./socket"

const app = express()
app.use(cors())

const { uri } = Config

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: uri,
    credentials: true,
  },
})

httpServer.listen(3001, () => {
  console.log("Server is listening to " + 3001), socket({ io })
})
