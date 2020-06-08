import fs from "fs";
import WebSocket from "ws";
import { Clock } from "three";
import { uniqueId } from "lodash";
import { World, Family, AnyComponents, Entity, Components } from "../game/ecs";
import { AvatarArchetype, PickupArchetype } from "../game/ecs/Archetypes";
import { getPlayerAvatar } from "../game/Helpers";
import { ActionType, Action, ItemSpawnAction } from "../game/Action";
import { AvatarSpawnSystem } from "./AvatarSpawnSystem";
import { ProjectileDisposalSystem } from "../game/systems/ProjectileDisposalSystem";
import { PhysicsSystem } from "../game/systems/PhysicsSystem";
import { ProjectileDamageSystem } from "../game/systems/ProjectileDamageSystem";
import { GameContext } from "../game/GameContext";
import { ItemSpawnSystem } from "../game/systems/ItemSpawnSystem";
import { ItemPickupSystem } from "../game/systems/ItemPickupSystem";

export interface PlayerConnectionArchetype extends AnyComponents {
    readonly socket: WebSocket;
    readonly respawn: Components.Respawn;
}

export class GameServer extends GameContext {
    public readonly world = new World();
    public readonly wss: WebSocket.Server;
    public readonly clock = new Clock();

    public readonly pickups = Family.findOrCreate(new PickupArchetype());
    public readonly avatars = Family.findOrCreate(new AvatarArchetype());
    public readonly players = Family.findOrCreate<PlayerConnectionArchetype>({
        socket: {} as WebSocket,
        respawn: new Components.Respawn(),
    });

    public constructor(wss: WebSocket.Server) {
        super();

        // Init level
        const levelPath = __dirname + "/../../assets/levels/arena.json";
        const levelJson = fs.readFileSync(levelPath);
        this.world.level.readJson(JSON.parse(String(levelJson)));

        // Init systems
        this.world.addSystem(new AvatarSpawnSystem(this));
        this.world.addSystem(new ItemSpawnSystem(this));
        this.world.addSystem(new ItemPickupSystem(this));
        this.world.addSystem(new PhysicsSystem(this.world));
        this.world.addSystem(new ProjectileDamageSystem(this));
        this.world.addSystem(new ProjectileDisposalSystem(this.world));

        // Start game loop
        setInterval(() => {
            const dt = this.clock.getDelta();
            this.world.update(dt);
        }, 1 / 60);

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

    public syncDispatch(action: Action) {
        const msg = Action.serialize(action);
        this.players.entities.forEach((player) => {
            player.socket.send(msg);
        });
    }

    public runDispatch(action: Action) {
        super.runDispatch(action);
        switch (action.type) {
            case ActionType.AvatarHit: {
                const target = this.avatars.entities.get(action.targetId);
                if (target === undefined) return;
                if (target.health.value > 0) return;

                const avatarId = action.targetId;
                this.dispatch(Action.removeEntity(avatarId));
                return;
            }
        }
    }

    private playerConnection(socket: WebSocket) {
        // Create player connection enetiy
        const id = uniqueId("p");
        const player: Entity<PlayerConnectionArchetype> = {
            id,
            socket,
            respawn: new Components.Respawn(),
        };
        this.world.addEntity(player);
        console.log(`> Server::playerConnection(${id})`);

        // Sync existing entities
        this.players.entities.forEach((peer) => {
            const avatar = getPlayerAvatar(peer.id, this.avatars);
            if (avatar !== undefined) {
                const { playerId, position } = avatar;
                const spawnPeer = Action.spawnAvatar(
                    playerId,
                    "enemy",
                    position
                );
                player.socket.send(Action.serialize(spawnPeer));
            }
        });

        // Sync exisitng ammo pickups
        this.pickups.entities.forEach((pickup) => {
            const action: ItemSpawnAction = {
                type: ActionType.ItemSpawn,
                entityId: pickup.id,
                pickup,
            };
            player.socket.send(Action.serialize(action));
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
                this.dispatch(Action.removeEntity(avatar.id));
            }
        }
    }

    private playerMessage(playerId: string, msg: string) {
        const action = Action.deserialize(msg);
        if (action === undefined) return;

        switch (action.type) {
            /**
             * Simple actions that are not crucial for gameplay.
             * Can be forwarded to peer players, no need for server side execution.
             */
            case ActionType.PlaySound:
            case ActionType.SpawnDecal: {
                this.forwardDispatch(playerId, msg);
                return;
            }

            /**
             * Crucial actions server & client side execution required.
             */
            case ActionType.AvatarHit:
            case ActionType.AvatarUpdate:
            case ActionType.EmitProjectile: {
                this.runDispatch(action);
                this.forwardDispatch(playerId, msg);
                return;
            }
        }
    }

    private forwardDispatch(playerId: string, msg: string) {
        this.players.entities.forEach((player) => {
            if (player.id !== playerId) {
                player.socket.send(msg);
            }
        });
    }
}
