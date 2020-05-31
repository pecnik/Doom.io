import WebSocket from "ws";
import { Clock } from "three";
import { uniqueId } from "lodash";
import { World, AnyComponents, Entity, Family } from "../game/ecs";

interface PlayerArchetype extends AnyComponents {
    readonly socket: WebSocket;
}

export class GameServer {
    public readonly wss: WebSocket.Server;
    public readonly world = new World();
    public readonly clock = new Clock();
    public readonly player = Family.findOrCreate<PlayerArchetype>({
        socket: {} as WebSocket,
    });

    public constructor(wss: WebSocket.Server) {
        this.wss = wss;
        this.wss.on("connection", (socket) => {
            const id = uniqueId("player");
            const player: Entity<PlayerArchetype> = { id, socket };

            socket.onclose = () => {
                this.world.removeEntity(player.id);
                console.log(`> Server::disconnect ${player.id}`);
            };

            this.world.addEntity(player);
            player.socket.send("new player");
            console.log(`> Server::connection ${player.id}`);
        });
    }

    public start() {
        console.log(`> Server::start`);
        setInterval(this.update.bind(this), 1 / 60);
    }

    public update() {
        const dt = this.clock.getDelta();
        this.world.update(dt);
    }
}
