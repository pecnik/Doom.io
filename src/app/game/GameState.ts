import { GameEntity } from "./GameEntity";
import { GameEvent, GameEventType } from "./GameEvent";
import { PerspectiveCamera, Scene } from "three";

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

            case GameEventType.PlayerLeftEvent: {
                const { playerId } = event;

                const deleteBatch = new Array<GameEntity>();
                this.entities.forEach(entity => {
                    if (entity.playerId === playerId) {
                        deleteBatch.push(entity);
                    }
                });

                this.entityGroups.forEach(group => {
                    deleteBatch.forEach(entity => group.delete(entity.id));
                });

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
                for (const [entityId, entity] of this.entities) {
                    if (entity.playerId === playerId) {
                        this.entities.delete(entityId);
                        this.players.delete(entityId);
                    }
                }
                break;
            }

            default:
                break;
        }
    }
}
