import { GameState } from "../game/GameState";
import { GameEntity } from "../game/GameEntity";

export class LocalPlayerSystem {
    private readonly socket: SocketIOClient.Socket;

    public constructor(socket: SocketIOClient.Socket) {
        this.socket = socket;
        this.updateLocalPlayerFlag = this.updateLocalPlayerFlag.bind(this);
    }

    public update(gameState: GameState) {
        gameState.players.forEach(this.updateLocalPlayerFlag);
        gameState.avatars.forEach(this.updateLocalPlayerFlag);
    }

    private updateLocalPlayerFlag(entity: GameEntity) {
        if (entity.playerId === undefined) return;
        if (entity.isLocalPlayer === undefined) return;
        entity.isLocalPlayer = entity.playerId === this.socket.id;
    }
}
