import { GameState } from "../game/GameState";

export class LocalPlayerSystem {
    private readonly socket: SocketIOClient.Socket;

    public constructor(socket: SocketIOClient.Socket) {
        this.socket = socket;
    }

    public update(gameState: GameState) {
        gameState.entities.forEach(entity => {
            if (entity.playerId === undefined) return;
            if (entity.isLocalPlayer === undefined) return;
            entity.isLocalPlayer = entity.playerId === this.socket.id;
        });
    }
}
