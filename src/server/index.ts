import express from "express";
import expressFileUpload from "express-fileupload";

const PORT = 8080;
const app = express();
app.use("/", express.static(__dirname + "/../../dist"));
app.use("/editor", express.static(__dirname + "/../../dist"));
app.use("/public", express.static(__dirname + "/../../public"));
app.use("/assets", express.static(__dirname + "/../../assets"));

app.use(expressFileUpload());
app.post("/texture/upload", (req, rsp) => {
    if (!req.files) return;
    if (!req.files.texture) return;

    const texture = req.files.texture;
    if (texture instanceof Array) return;

    const name = [
        Date.now().toString(16),
        random(1000000, 9999999).toString(16),
    ].join("");

    const src = `/assets/levels/textures/uploads/${name}.png`;
    const filepath = __dirname + `/../../${src}`;
    texture.mv(filepath, (err) => {
        if (err) {
            rsp.send(err);
        } else {
            rsp.json({ src });
        }
    });
});

import WebSocket from "ws";
import { GameServer } from "./GameServer";
import { random } from "lodash";

const wss = new WebSocket.Server({ server: app.listen(PORT) });
new GameServer(wss);
