"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var socket_io_1 = require("socket.io");
var http_1 = require("http");
var cors_1 = __importDefault(require("cors"));
var config_1 = require("./config");
var socket_1 = __importDefault(require("./socket"));
var app = (0, express_1.default)();
app.use((0, cors_1.default)());
var uri = config_1.Config.uri;
var httpServer = (0, http_1.createServer)(app);
var io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: uri,
        credentials: true,
    },
});
httpServer.listen(3001, function () {
    console.log("Server is listening to " + 3001), (0, socket_1.default)({ io: io });
});
