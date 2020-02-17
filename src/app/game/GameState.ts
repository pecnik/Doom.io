import { GameEntity } from "./GameEntity";
import { GameEvent, GameEventType } from "./GameEvent";
import { PerspectiveCamera, Scene } from "three";
import { findInMap } from "../core/Utils";

export class GameState {
    public readonly camera = new PerspectiveCamera(90);
    public readonly scene = new Scene();

    public readonly players = new Map<string, GameEntity.Player>();
    public readonly avatars = new Map<string, GameEntity.Avatar>();
    public readonly entityGroups = [this.players, this.avatars];

    public dispatch(event: GameEvent) {
        switch (event.type) {
            case GameEventType.PlayerJoinEvent: {
                const { playerId } = event;
                const player = new GameEntity.Player(playerId);

                this.players.set(playerId, player);
                break;
            }

            case GameEventType.AvatarSpawnEvent: {
                const { playerId, position } = event;
                const avatar = new GameEntity.Avatar(playerId);

                avatar.position.copy(position);

                this.avatars.set(avatar.id, avatar);

                // Hide avatar model from pov camera
                let count = 0;
                this.avatars.forEach(avatar => {
                    count++;
                    avatar.mesh.traverse(obj => obj.layers.set(count));
                    avatar.camera.layers.enableAll();
                    avatar.camera.layers.disable(count);
                });

                // Add avatar mehs to scene
                avatar.mesh.add(avatar.camera);
                this.scene.add(avatar.mesh);

                break;
            }

            case GameEventType.AvatarDeathEvent: {
                const { playerId } = event;
                const [avatar] = findInMap(this.avatars, avatar => {
                    return avatar.playerId === playerId;
                });

                if (avatar !== undefined) {
                    this.avatars.delete(avatar.id);
                    this.scene.remove(avatar.mesh);
                }

                break;
            }

            case GameEventType.PlayerLeftEvent: {
                const { playerId } = event;
                const [player] = findInMap(this.players, avatar => {
                    return avatar.playerId === playerId;
                });
                if (player !== undefined) {
                    this.players.delete(player.id);
                }
                break;
            }

            default:
                break;
        }
    }
}
