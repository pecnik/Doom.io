import fs from "fs";
import SocketIO from "socket.io";
import { uniqueId } from "lodash";
import { Clock } from "three";
import { World } from "./ecs";
import { Netcode } from "./Netcode";
import { ClientConnectionSystem } from "./systems/server/ClientConnectionSystem";
import { AvatarSpawnSystem } from "./systems/server/AvatarSpawnSystem";

export class GameServer {
    public readonly world = new World();
    public readonly clock = new Clock();
    public readonly io: SocketIO.Server;

    public constructor(io: SocketIO.Server) {
        (io.engine as any).generateId = () => uniqueId("p");
        this.io = io;

        // Init level
        const levelPath = __dirname + "/../../assets/levels/castle.json";
        const levelJson = fs.readFileSync(levelPath);
        this.world.level.data = JSON.parse(String(levelJson));
        this.world.level.updateSpawnPoints();

        // Init systems
        this.world.addSystem(new ClientConnectionSystem(this));
        this.world.addSystem(new AvatarSpawnSystem(this));

        setInterval(() => {
            this.world.update(this.clock.getDelta());
        }, 1000 / 30);
    }

    public getSocket(id: string) {
        return this.io.sockets.connected[id];
    }

    public dispatch(event: Netcode.Event, ctx: Netcode.Ctx) {
        Netcode.dispatch(this.world, event);
        ctx.emit("dispatch", event);
    }
}
