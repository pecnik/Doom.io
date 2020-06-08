import WebSocket from "ws";
import { Vector3 } from "three";
import { sample } from "lodash";
import { Family, System, Components } from "../game/ecs";
import { AvatarArchetype } from "../game/ecs/Archetypes";
import { getPlayerAvatar } from "../game/Helpers";
import { ActionType, AvatarSpawnAction, Action } from "../game/Action";
import { PlayerConnectionArchetype } from "./GameServer";
import { GameContext } from "../game/GameContext";

export class AvatarSpawnSystem extends System {
    private readonly game: GameContext;
    private readonly avatars = Family.findOrCreate(new AvatarArchetype());
    private readonly players = Family.findOrCreate<PlayerConnectionArchetype>({
        socket: {} as WebSocket,
        respawn: new Components.Respawn(),
    });

    public constructor(game: GameContext) {
        super(game.world);
        this.game = game;
    }

    public update() {
        this.players.entities.forEach((player) => {
            const avatar = getPlayerAvatar(player.id, this.avatars);
            if (avatar !== undefined) return;

            if (!player.respawn.inProgress) {
                player.respawn.inProgress = true;
                player.respawn.time = this.world.elapsedTime;
                return;
            }

            const delta = this.world.elapsedTime - player.respawn.time;
            if (delta < 1) return;

            player.respawn.inProgress = false;
            player.respawn.time = 0;

            const actions = this.spawnAvatarAction(player.id);
            const [spawnLocalAvatar, spawnEnemyAvatar] = actions;
            this.game.runDispatch(spawnEnemyAvatar);
            console.log(`> Server::spawn Avatar(${player.id})`);

            const spawnLocalAvatarMsg = Action.serialize(spawnLocalAvatar);
            const spawnEnemyAvatarMsg = Action.serialize(spawnEnemyAvatar);
            this.players.entities.forEach((peer) => {
                if (peer === player) {
                    peer.socket.send(spawnLocalAvatarMsg);
                } else {
                    peer.socket.send(spawnEnemyAvatarMsg);
                }
            });
        });
    }

    private spawnAvatarAction(playerId: string): AvatarSpawnAction[] {
        const avatarId = "a" + playerId;
        const position = sample(this.world.level.getSpawnPoints());
        const spawnAvatar: AvatarSpawnAction = {
            type: ActionType.AvatarSpawn,
            playerId,
            avatarId,
            avatarType: "enemy",
            position: position || new Vector3(),
        };

        return [
            { ...spawnAvatar, avatarType: "local" },
            { ...spawnAvatar, avatarType: "enemy" },
        ];
    }
}
