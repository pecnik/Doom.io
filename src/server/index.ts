import express from "express";
import SocketIO from "socket.io";
import { GameServer } from "../game/GameServer";

const PORT = 8080;
const app = express();
app.use("/", express.static(__dirname + "/../../dist"));
app.use("/editor", express.static(__dirname + "/../../dist"));
app.use("/public", express.static(__dirname + "/../../public"));
app.use("/assets", express.static(__dirname + "/../../assets"));

const srv = app.listen(PORT);
const io = SocketIO.listen(srv);
new GameServer(io);
