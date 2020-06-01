import fs from "fs";
import WebSocket from "ws";
import { Clock, Vector3 } from "three";
import { uniqueId, sample } from "lodash";
import { World, Family, AnyComponents, Entity } from "../game/ecs";
import {
    AvatarSpawn,
    NetworkEvent,
    AvatarFrameUpdate,
    NetworkEventType,
    AvatarDeath,
    AvatarHit,
} from "../game/network/NetworkEvents";
import { AvatarArchetype } from "../game/ecs/Archetypes";
import { getPlayerAvatar } from "../game/Helpers";

interface PlayerConnectionArchetype extends AnyComponents {
    readonly socket: WebSocket;
}

export class GameServer {
    private readonly wss: WebSocket.Server;
    private readonly world = new World();
    private readonly clock = new Clock();

    private readonly avatars = Family.findOrCreate(new AvatarArchetype());
    private readonly players = Family.findOrCreate<PlayerConnectionArchetype>({
        socket: {} as WebSocket,
    });

    public constructor(wss: WebSocket.Server) {
        // Init level
        const levelPath = __dirname + "/../../assets/levels/test_arena.json";
        const levelJson = fs.readFileSync(levelPath);
        this.world.level.readJson(JSON.parse(String(levelJson)));

        // Start game loop
        setInterval(this.update.bind(this), 1 / 60);

        // Handle socket events
        this.wss = wss;
        this.wss.on("connection", (socket) => {
            const playerId = this.playerConnection(socket);
            socket.onclose = () => this.playerDisconnect(playerId);
            socket.onmessage = (ev) => {
                this.playerMessage(playerId, ev.data as string);
            };
        });
    }

    private update() {
        const dt = this.clock.getDelta();
        this.world.update(dt);
    }

    private playerConnection(socket: WebSocket) {
        // Create player connection enetiy
        const id = uniqueId("p");
        const player: Entity<PlayerConnectionArchetype> = { id, socket };
        this.world.addEntity(player);
        console.log(`> Server::playerConnection(${id})`);

        // Spawn avatar
        const spawn = sample(this.world.level.getSpawnPoints());
        const spawnAvatar = new AvatarSpawn({
            playerId: player.id,
            avatarId: "a" + player.id,
            avatarType: "enemy",
            position: spawn || new Vector3(),
        });

        // First spawn on server
        AvatarSpawn.execute(this.world, spawnAvatar);

        // Then on local player side
        const spawnLocal = { ...spawnAvatar };
        spawnLocal.avatarType = "local";
        const spawnLocalMsg = NetworkEvent.serialize(spawnLocal);
        player.socket.send(spawnLocalMsg);

        // Update peer players
        const spawnAvatarMsg = NetworkEvent.serialize(spawnAvatar);
        this.players.entities.forEach((peer) => {
            if (peer === player) return;

            // Spawn new player
            peer.socket.send(spawnAvatarMsg);

            // Spawn avatar of peer
            const avatar = getPlayerAvatar(peer.id, this.avatars);
            if (avatar === undefined) return;

            const spawnAvatar = new AvatarSpawn({
                playerId: avatar.playerId,
                avatarId: avatar.id,
                avatarType: "enemy",
                position: avatar.position,
            });

            const spawnEnemyMsg = NetworkEvent.serialize(spawnAvatar);
            player.socket.send(spawnEnemyMsg);
        });

        return id;
    }

    private playerDisconnect(playerId: string) {
        const player = this.players.entities.get(playerId);
        if (player !== undefined) {
            this.world.removeEntity(player.id);
            console.log(`> Server::playerDisconnect(${playerId})`);

            const avatar = getPlayerAvatar(player.id, this.avatars);
            if (avatar !== undefined) {
                const avatarDeath = new AvatarDeath({ avatarId: avatar.id });
                AvatarDeath.execute(this.world, avatarDeath);

                const avatarDeathMsg = NetworkEvent.serialize(avatarDeath);
                this.broadcast(player.id, avatarDeathMsg);
            }
        }
    }

    private broadcast(playerId: string, msg: string) {
        this.players.entities.forEach((player) => {
            if (player.id !== playerId) {
                player.socket.send(msg);
            }
        });
    }

    private playerMessage(playerId: string, msg: string) {
        const event = NetworkEvent.deserialize(msg);
        switch (event.type) {
            case NetworkEventType.AvatarFrameUpdate: {
                AvatarFrameUpdate.execute(this.world, event);
                this.broadcast(playerId, msg);
                return;
            }

            case NetworkEventType.AvatarHit: {
                const shooter = this.avatars.entities.get(event.shooterId);
                if (shooter === undefined) return;
                if (shooter.playerId !== playerId) return;

                const target = this.avatars.entities.get(event.targetId);
                if (target === undefined) return;
                if (target.health.value <= 0) return;

                AvatarHit.execute(this.world, event);
                this.broadcast(playerId, msg);

                if (target.health.value <= 0) {
                    const avatarId = event.targetId;
                    const avatarDeath = new AvatarDeath({ avatarId });
                    AvatarDeath.execute(this.world, avatarDeath);

                    const avatarDeathMsg = NetworkEvent.serialize(avatarDeath);
                    this.players.entities.forEach((player) => {
                        player.socket.send(avatarDeathMsg);
                    });
                }

                return;
            }

            case NetworkEventType.PlaySound:
            case NetworkEventType.SpawnDecal: {
                this.broadcast(playerId, msg);
                return;
            }
        }
    }
}
