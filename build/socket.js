"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var getTimeString = function () {
    var date = new Date();
    var hrs = "";
    var mins = "";
    if (date.getHours() >= 0 && date.getHours() < 10) {
        hrs = "0".concat(date.getHours());
    }
    else {
        hrs = "".concat(date.getHours());
    }
    if (date.getMinutes() >= 0 && date.getMinutes() < 10) {
        mins = "0".concat(date.getMinutes());
    }
    else {
        mins = "".concat(date.getMinutes());
    }
    var time = "".concat(hrs, ":").concat(mins);
    return time;
};
var rooms = new Set([]);
var socket = function (_a) {
    var io = _a.io;
    io.on("connection", function (socket) {
        socket.emit("show_rooms", rooms);
        // Creating a new room
        socket.on("create_room", function (newRoomname, owner, cb) {
            var room = {
                roomname: newRoomname,
                owner: owner,
                curNum: 1,
                usernames: [],
                messages: [],
            };
            rooms.add(room);
            socket.broadcast.emit("show_rooms", Array.from(rooms));
            socket.join(newRoomname);
            socket.emit("created_room");
            cb();
        });
        socket.on("send_message", function (_a) {
            var roomname = _a.roomname, message = _a.message, username = _a.username;
            var time = getTimeString();
            var data = {
                time: time,
                message: message,
                username: username,
                type: "MESSAGE",
            };
            var msgs = [];
            rooms.forEach(function (room) {
                if (room.roomname === roomname) {
                    room.messages.push(data);
                    msgs = room.messages;
                }
            });
            io.in(roomname).emit("new_message", msgs);
        });
        socket.on("join_room", function (roomname, username, cb) {
            var foundRoom = undefined;
            var msg = {
                message: "".concat(username, " has joined the room"),
                time: getTimeString(),
                type: "GENERAL",
                username: username,
            };
            rooms.forEach(function (room) {
                if (room.roomname === roomname) {
                    room.curNum++;
                    room.usernames.push(username);
                    room.messages.push(msg);
                    foundRoom = room;
                }
            });
            socket.join(roomname);
            io.emit("show_rooms", Array.from(rooms));
            io.in(roomname).emit("joined_room", foundRoom);
            cb();
        });
        socket.on("leave_room", function (roomname, username, cb) {
            rooms.forEach(function (room) {
                if (room.roomname === roomname && room.owner === username) {
                    rooms.delete(room);
                    io.in(roomname).emit("room_deleted");
                    io.socketsLeave(roomname);
                    io.emit("show_rooms", Array.from(rooms));
                }
                else if (room.roomname === roomname && room.owner !== username) {
                    var foundRoom_1 = undefined;
                    var msg_1 = {
                        message: "".concat(username, " has left the room"),
                        time: getTimeString(),
                        type: "GENERAL",
                        username: username,
                    };
                    rooms.forEach(function (room) {
                        if (room.roomname === roomname) {
                            room.curNum--;
                            room.messages.push(msg_1);
                            foundRoom_1 = room;
                        }
                    });
                    var idx = room.usernames.indexOf(username);
                    if (idx !== -1) {
                        room.usernames.splice(idx, 1);
                    }
                    socket.leave(roomname);
                    io.emit("show_rooms", Array.from(rooms));
                    io.in(roomname).emit("left_room", foundRoom_1);
                }
                cb();
            });
        });
    });
};
exports.default = socket;
