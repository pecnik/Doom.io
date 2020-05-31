import fs from "fs";
import WebSocket from "ws";
import { Clock, Vector3 } from "three";
import { uniqueId, sample } from "lodash";
import { World, AnyComponents, Entity, Family } from "../game/ecs";
import { SpawnLocalAvatar, serialize } from "../game/events/Netcode";

interface PlayerArchetype extends AnyComponents {
    readonly socket: WebSocket;
}

export class GameServer {
    public readonly wss: WebSocket.Server;
    public readonly world = new World();
    public readonly clock = new Clock();
    public readonly players = Family.findOrCreate<PlayerArchetype>({
        socket: {} as WebSocket,
    });

    public constructor(wss: WebSocket.Server) {
        this.wss = wss;
        this.wss.on("connection", (socket) => {
            const id = uniqueId("p");
            const player: Entity<PlayerArchetype> = { id, socket };
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
        const spawn = sample(this.world.level.getSpawnPoints());
        const spawnLocalAvatar = new SpawnLocalAvatar();
        spawnLocalAvatar.playerId = player.id;
        spawnLocalAvatar.position.copy(spawn || new Vector3());

        const msg = serialize(spawnLocalAvatar);
        player.socket.send(msg);

        this.world.addEntity(player);
    }
}
