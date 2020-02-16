import { GameEntity } from "./GameEntity";
import { GameEvent, GameEventType } from "./GameEvent";
import { PerspectiveCamera, Scene } from "three";
import { findInMap } from "../core/Utils";

export class GameState {
    public readonly camera = new PerspectiveCamera(90);
    public readonly scene = new Scene();

    public readonly entities = new Map<string, GameEntity>();
    public readonly players = new Map<string, GameEntity.Player>();
    public readonly avatars = new Map<string, GameEntity.Avatar>();
    public readonly entityGroups = [this.entities, this.players, this.avatars];

    public dispatch(event: GameEvent) {
        switch (event.type) {
            case GameEventType.PlayerJoinEvent: {
                const { playerId } = event;
                const player = new GameEntity.Player(playerId);
                this.entities.set(playerId, player);
                this.players.set(playerId, player);
                break;
            }

            case GameEventType.AvatarSpawnEvent: {
                const { playerId, position } = event;
                const avatar = new GameEntity.Avatar(playerId);
                avatar.position.copy(position);
                this.entities.set(avatar.id, avatar);
                this.avatars.set(avatar.id, avatar);
                break;
            }

            case GameEventType.AvatarDeathEvent: {
                const { playerId } = event;
                const [avatar] = findInMap(this.avatars, avatar => {
                    return avatar.playerId === playerId;
                });

                if (avatar !== undefined) {
                    this.entities.delete(avatar.id);
                    this.avatars.delete(avatar.id);
                }

                break;
            }

            case GameEventType.PlayerLeftEvent: {
                const { playerId } = event;
                const [player] = findInMap(this.players, avatar => {
                    return avatar.playerId === playerId;
                });
                if (player !== undefined) {
                    this.entities.delete(player.id);
                    this.players.delete(player.id);
                }
                break;
            }

            default:
                break;
        }
    }
}
