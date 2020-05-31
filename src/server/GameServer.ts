import WebSocket from "ws";
import { Clock } from "three";
import { uniqueId } from "lodash";
import {
    World,
    AnyComponents,
    Entity,
    Components,
    System,
    Family,
} from "../game/ecs";

interface PlayerArchetype extends AnyComponents {
    readonly socket: WebSocket;
    readonly messageBuffer: Components.MessageBuffer;
    readonly playerFrameState: Components.PlayerFrameState;
}

export class GameServer {
    public readonly wss: WebSocket.Server;
    public readonly world = new World();
    public readonly clock = new Clock();
    public readonly player = Family.findOrCreate<PlayerArchetype>({
        socket: {} as WebSocket,
        messageBuffer: new Components.MessageBuffer(),
        playerFrameState: new Components.PlayerFrameState(),
    });

    public constructor(wss: WebSocket.Server) {
        this.wss = wss;
        this.wss.on("connection", (socket) => {
            const id = uniqueId("player");
            const player: Entity<PlayerArchetype> = {
                id,
                socket,
                messageBuffer: new Components.MessageBuffer(),
                playerFrameState: new Components.PlayerFrameState(),
            };

            socket.onmessage = (ev) => {
                player.messageBuffer.push(ev.data.toString());
            };

            socket.onclose = () => {
                this.world.removeEntity(player.id);
            };

            this.world.addEntity(player);
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
