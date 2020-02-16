import SocketIO from "socket.io";
import { uniqueId } from "lodash";
import { GameState } from "./game/GameState";
import { GameEvent, PlayerLeftEvent, PlayerJoinEvent } from "./game/GameEvent";

export class GameServer {
    private readonly gameState = new GameState();
    private readonly io: SocketIO.Server;

    public constructor(io: SocketIO.Server) {
        (io.engine as any).generateId = () => uniqueId("p");
        this.io = io;
        this.io.on("connect", socket => {
            const playerId = socket.id;

            setTimeout(() => {
                this.dispatch(new PlayerJoinEvent(playerId));
            }, 100);

            socket.on("disconnect", () => {
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
