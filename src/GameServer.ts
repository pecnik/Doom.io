import SocketIO from "socket.io";
import { uniqueId } from "lodash";
import { Clock } from "three";
import { World } from "./World";
import { NetworkSystem } from "./systems/server/NetworkSystem";

export class GameServer {
    private readonly io: SocketIO.Server;
    private readonly world: World;
    private readonly clock: Clock;

    public constructor(io: SocketIO.Server) {
        (io.engine as any).generateId = () => uniqueId("p");
        this.io = io;
        this.io.on("connect", socket => {
            console.log(`> Connection::${socket.id}`);
            socket.on("disconnect", () => {
                console.log(`> Disconnect::${socket.id}`);
            });
        });

        this.clock = new Clock();
        this.world = new World();

        this.world.addSystem(new NetworkSystem(this.world, this.io));

        setInterval(() => {
            this.world.update(this.clock.getDelta());
        }, 1000 / 60);
    }
}
