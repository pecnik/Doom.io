import SocketIO from "socket.io";
import { Vector3 } from "three";
import { uniqueId, random } from "lodash";
import { GameState } from "./game/GameState";
import {
    GameEvent,
    PlayerLeftEvent,
    PlayerJoinEvent,
    AvatarSpawnEvent,
    AvatarDeathEvent
} from "./game/GameEvent";

export class GameServer {
    private readonly gameState = new GameState();
    private readonly io: SocketIO.Server;

    public constructor(io: SocketIO.Server) {
        (io.engine as any).generateId = () => uniqueId("p");
        this.io = io;
        this.io.on("connect", socket => {
            const playerId = socket.id;

            this.gameState.players.forEach(player => {
                socket.emit("dispatch", new PlayerJoinEvent(player.playerId));
            });

            this.gameState.avatars.forEach(avatar => {
                socket.emit(
                    "dispatch",
                    new AvatarSpawnEvent(avatar.playerId, avatar.position)
                );
            });

            setTimeout(() => {
                const spawn = new Vector3();
                spawn.x = random(1, 6, true);
                spawn.z = random(1, 6, true);
                this.dispatch(new PlayerJoinEvent(playerId));
                this.dispatch(new AvatarSpawnEvent(playerId, spawn));
            }, 100);

            socket.on("disconnect", () => {
                this.dispatch(new AvatarDeathEvent(playerId));
                this.dispatch(new PlayerLeftEvent(playerId));
            });
        });
    }

    private dispatch(event: GameEvent) {
        console.log(`> dispatch::${event.type}`);
        this.gameState.dispatch(event);
        this.gameState.players.forEach(player => {
            const socket = this.io.sockets.connected[player.playerId];
            if (socket !== undefined) {
                socket.emit("dispatch", event);
            }
        });
    }
}
