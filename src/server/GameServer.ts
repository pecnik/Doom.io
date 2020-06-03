import fs from "fs";
import WebSocket from "ws";
import { Clock, Vector3 } from "three";
import { uniqueId, sample } from "lodash";
import { World, Family, AnyComponents, Entity } from "../game/ecs";
import { AvatarArchetype } from "../game/ecs/Archetypes";
import { getPlayerAvatar } from "../game/Helpers";
import {
    ActionType,
    AvatarSpawnAction,
    runAction,
    Action,
    AvatarDeathAction,
} from "../game/Action";

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
        const levelPath = __dirname + "/../../assets/levels/arena.json";
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

        // Spawn avatar in the servers world
        const spawn = sample(this.world.level.getSpawnPoints());
        const spawnServerAvatar = this.spawnAvatar(player.id, "enemy", spawn);
        runAction(this.world, spawnServerAvatar);

        // Spawn local-avatar in the players workd
        const spawnLocalAvatar = this.spawnAvatar(player.id, "local", spawn);
        player.socket.send(Action.serialize(spawnLocalAvatar));

        // Sync player-peer avatars
        const spawnAvatar = Action.serialize(spawnServerAvatar);
        this.players.entities.forEach((peer) => {
            if (peer === player) return;

            // Spawn player in peers world
            peer.socket.send(spawnAvatar);

            // Spawn peer in players world
            const avatar = getPlayerAvatar(peer.id, this.avatars);
            if (avatar !== undefined) {
                const { playerId, position } = avatar;
                const spawnPeer = this.spawnAvatar(playerId, "enemy", position);
                player.socket.send(Action.serialize(spawnPeer));
            }
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
                const avatarDeath = this.avatarDeath(avatar.id);
                runAction(this.world, avatarDeath);
                this.broadcast(player.id, Action.serialize(avatarDeath));
            }
        }
    }

    private playerMessage(playerId: string, msg: string) {
        const action = Action.deserialize(msg);
        if (action === undefined) return;

        switch (action.type) {
            // Run & broadcast
            case ActionType.AvatarUpdate: {
                runAction(this.world, action);
                this.broadcast(playerId, msg);
                return;
            }

            // Only broadcast
            case ActionType.PlaySound:
            case ActionType.SpawnDecal: {
                this.broadcast(playerId, msg);
                return;
            }

            case ActionType.AvatarHit: {
                const shooter = this.avatars.entities.get(action.shooterId);
                if (shooter === undefined) return;
                if (shooter.playerId !== playerId) return;

                const target = this.avatars.entities.get(action.targetId);
                if (target === undefined) return;
                if (target.health.value <= 0) return;

                runAction(this.world, action);
                this.broadcast(playerId, msg);

                if (target.health.value <= 0) {
                    const avatarId = action.targetId;
                    const avatarDeath = this.avatarDeath(avatarId);
                    runAction(this.world, avatarDeath);
                    this.broadcastToAll(Action.serialize(avatarDeath));
                }

                return;
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

    private broadcastToAll(msg: string) {
        this.players.entities.forEach((player) => {
            player.socket.send(msg);
        });
    }

    private spawnAvatar(
        playerId: string,
        avatarType: "local" | "enemy",
        position = new Vector3()
    ): AvatarSpawnAction {
        const avatarId = "a" + playerId;
        position = position || new Vector3();
        return {
            type: ActionType.AvatarSpawn,
            playerId,
            avatarId,
            avatarType,
            position,
        };
    }

    private avatarDeath(avatarId: string): AvatarDeathAction {
        return { type: ActionType.AvatarDeath, avatarId };
    }
}
