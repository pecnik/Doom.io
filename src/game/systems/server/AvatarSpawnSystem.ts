import { System } from "../../ecs";
import { GameServer } from "../../GameServer";
import { PlayerArchetype, AvatarArchetype } from "../../ecs/Archetypes";
import { Netcode } from "../../data/Netcode";
import { sample } from "lodash";
import { getPlayerAvatar } from "../../Helpers";

export class AvatarSpawnSystem extends System {
    private readonly server: GameServer;

    private readonly players = this.createEntityFamily({
        archetype: new PlayerArchetype(),
    });

    private readonly avatars = this.createEntityFamily({
        archetype: new AvatarArchetype(),
    });

    public constructor(server: GameServer) {
        super(server.world);
        this.server = server;
    }

    public update() {
        this.players.entities.forEach((player) => {
            const avatar = getPlayerAvatar(player.id, this.avatars);
            if (avatar !== undefined) return;

            const socket = this.server.getSocket(player.id);
            if (socket === undefined) return;

            const spawn = sample(this.engine.level.spawnPoints);
            if (spawn === undefined) return;

            // Spawn player avatar
            const spawnPlayer = new Netcode.SpawnPlayerAvatar(player, spawn);
            socket.emit("dispatch", spawnPlayer);

            // Spawn enemy avatar
            const spawnEnemy = new Netcode.SpawnEnemyAvatar(player, spawn);
            this.server.dispatch(spawnEnemy, socket.broadcast);
        });
    }
}
