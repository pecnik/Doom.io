import express from "express";
const PORT = 8080;
const app = express();
app.use("/", express.static(__dirname + "/../../dist"));
app.use("/public", express.static(__dirname + "/../../public"));
app.listen(PORT);
