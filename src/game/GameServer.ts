import fs from "fs";
import SocketIO from "socket.io";
import { uniqueId } from "lodash";
import { Clock } from "three";
import { World } from "./ecs";
import { ServerNetcodeSystem } from "./systems/ServerNetcodeSystem";

export class GameServer {
    private readonly world = new World();
    private readonly clock = new Clock();

    public constructor(io: SocketIO.Server) {
        (io.engine as any).generateId = () => uniqueId("p");

        // Init level
        const levelPath = __dirname + "/../../assets/levels/castle.json";
        const levelJson = fs.readFileSync(levelPath);
        this.world.level.data = JSON.parse(String(levelJson));
        this.world.level.updateSpawnPoints();

        // Init systems
        this.world.addSystem(new ServerNetcodeSystem(this.world, io));

        setInterval(() => {
            this.world.update(this.clock.getDelta());
        }, 1000 / 30);
    }
}
