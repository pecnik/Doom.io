import express from "express";

const PORT = 8080;
const app = express();
app.use("/", express.static(__dirname + "/../../dist"));
app.use("/editor", express.static(__dirname + "/../../dist"));
app.use("/public", express.static(__dirname + "/../../public"));
app.use("/assets", express.static(__dirname + "/../../assets"));

import WebSocket from "ws";

const wss = new WebSocket.Server({ server: app.listen(PORT) });
wss.on("connection", (socket) => {
    socket.send("banananas");
    console.log("Connection");
});
