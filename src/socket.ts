import { Server, Socket } from "socket.io"

// Room Model
// roomname: string
// author: username: string
// numOfPeople: number = 0
interface Room {
  roomname: string
  maxNum?: number
  curNum: number
  owner: string
  usernames: string[]
  messages: Msg[]
}

interface Msg {
  message: string
  time: string
  username: string
  type: string
}

const getTimeString = (): string => {
  const date: Date = new Date()

  let hrs: string = ""
  let mins: string = ""

  if (date.getHours() >= 0 && date.getHours() < 10) {
    hrs = `0${date.getHours()}`
  } else {
    hrs = `${date.getHours()}`
  }

  if (date.getMinutes() >= 0 && date.getMinutes() < 10) {
    mins = `0${date.getMinutes()}`
  } else {
    mins = `${date.getMinutes()}`
  }

  const time: string = `${hrs}:${mins}`

  return time
}

const rooms = new Set<Room>([])

const socket = ({ io }: { io: Server }) => {
  io.on("connection", (socket: Socket) => {
    socket.emit("show_rooms", rooms)

    // Creating a new room
    socket.on(
      "create_room",
      (newRoomname: string, owner: string, cb: Function) => {
        const room: Room = {
          roomname: newRoomname,
          owner,
          curNum: 1,
          usernames: [],
          messages: [],
        }

        rooms.add(room)
        socket.broadcast.emit("show_rooms", Array.from(rooms))

        socket.join(newRoomname)
        socket.emit("created_room")
        cb()
      }
    )

    socket.on("send_message", ({ roomname, message, username }) => {
      const time = getTimeString()

      const data: Msg = {
        time,
        message,
        username,
        type: "MESSAGE",
      }

      let msgs: Msg[] = []

      rooms.forEach(room => {
        if (room.roomname === roomname) {
          room.messages.push(data)

          msgs = room.messages
        }
      })

      io.in(roomname).emit("new_message", msgs)
    })

    socket.on(
      "join_room",
      (roomname: string, username: string, cb: Function) => {
        let foundRoom: Room | undefined = undefined

        const msg: Msg = {
          message: `${username} has joined the room`,
          time: getTimeString(),
          type: "GENERAL",
          username,
        }

        rooms.forEach(room => {
          if (room.roomname === roomname) {
            room.curNum++
            room.usernames.push(username)
            room.messages.push(msg)

            foundRoom = room
          }
        })

        socket.join(roomname)

        io.emit("show_rooms", Array.from(rooms))
        io.in(roomname).emit("joined_room", foundRoom)
        cb()
      }
    )

    socket.on("leave_room", (roomname: string, username: string, cb) => {
      rooms.forEach(room => {
        if (room.roomname === roomname && room.owner === username) {
          rooms.delete(room)

          io.in(roomname).emit("room_deleted")
          io.socketsLeave(roomname)
          io.emit("show_rooms", Array.from(rooms))
        } else if (room.roomname === roomname && room.owner !== username) {
          let foundRoom: Room | undefined = undefined

          const msg: Msg = {
            message: `${username} has left the room`,
            time: getTimeString(),
            type: "GENERAL",
            username,
          }

          rooms.forEach(room => {
            if (room.roomname === roomname) {
              room.curNum--
              room.messages.push(msg)

              foundRoom = room
            }
          })

          const idx = room.usernames.indexOf(username)

          if (idx !== -1) {
            room.usernames.splice(idx, 1)
          }

          socket.leave(roomname)
          io.emit("show_rooms", Array.from(rooms))
          io.in(roomname).emit("left_room", foundRoom)
        }

        cb()
      })
    })
  })
}

export default socket
