import fs from "fs";
import WebSocket from "ws";
import { Clock, Vector3 } from "three";
import { uniqueId, sample } from "lodash";
import { World, Entity, Family } from "../game/ecs";
import {
    SpawnLocalAvatar,
    serialize,
    SpawnEnemyAvatar,
} from "../game/events/Netcode";
import { AvatarArchetype } from "../game/ecs/Archetypes";

interface PlayerArchetype extends AvatarArchetype {
    readonly socket: WebSocket;
}

export class GameServer {
    public readonly wss: WebSocket.Server;
    public readonly world = new World();
    public readonly clock = new Clock();
    public readonly players = Family.findOrCreate<PlayerArchetype>({
        socket: {} as WebSocket,
        ...new AvatarArchetype(),
    });

    public constructor(wss: WebSocket.Server) {
        this.wss = wss;
        this.wss.on("connection", (socket) => {
            const id = uniqueId("p");
            const player: Entity<PlayerArchetype> = {
                id,
                socket,
                ...new AvatarArchetype(),
            };
            this.joinPlayer(player);
        });

        // Init level
        const levelPath = __dirname + "/../../assets/levels/test_arena.json";
        const levelJson = fs.readFileSync(levelPath);
        this.world.level.readJson(JSON.parse(String(levelJson)));
    }

    public start() {
        console.log(`> Server::start`);
        setInterval(this.update.bind(this), 1 / 60);
    }

    public update() {
        const dt = this.clock.getDelta();
        this.world.update(dt);
    }

    private joinPlayer(player: Entity<PlayerArchetype>) {
        // Init player
        const spawn = sample(this.world.level.getSpawnPoints());
        player.health.value = 100;
        player.position.copy(spawn || new Vector3());
        this.world.addEntity(player);

        // Spawn the local avatar
        const spawnLocalAvatar = new SpawnLocalAvatar(player);
        player.socket.send(serialize(spawnLocalAvatar));

        // Sync players
        const peerPlayers = this.players.toArray().filter((p) => p !== player);
        peerPlayers.forEach((peerPlayer) => {
            player.socket.send(serialize(new SpawnEnemyAvatar(peerPlayer)));
            peerPlayer.socket.send(serialize(new SpawnEnemyAvatar(player)));
        });
    }
}
