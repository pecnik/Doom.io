import { System, Entity } from "../../ecs";
import { GameServer } from "../../GameServer";
import { PlayerArchetype, AvatarArchetype } from "../../ecs/Archetypes";
import { Netcode } from "../../Netcode";
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

            if (player.avatarSpawner.spawnTime === 0) {
                player.avatarSpawner.spawnTime = this.world.elapsedTime + 2;
            }

            if (player.avatarSpawner.spawnTime <= this.world.elapsedTime) {
                player.avatarSpawner.spawnTime = 0;
                this.spawnPlayerAvatar(player);
            }
        });
    }

    private spawnPlayerAvatar(player: Entity<PlayerArchetype>) {
        const socket = this.server.getSocket(player.id);
        if (socket === undefined) return false;

        const spawn = sample(this.world.level.spawnPoints);
        if (spawn === undefined) return false;

        // Spawn player avatar
        const spawnPlayer = new Netcode.SpawnPlayerAvatar(player, spawn);
        socket.emit("dispatch", spawnPlayer);

        // Spawn enemy avatar
        const spawnEnemy = new Netcode.SpawnEnemyAvatar(player, spawn);
        this.server.dispatch(spawnEnemy, socket.broadcast);
        return true;
    }
}
