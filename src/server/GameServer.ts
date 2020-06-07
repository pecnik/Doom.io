import fs from "fs";
import WebSocket from "ws";
import { Clock, Vector3 } from "three";
import { uniqueId } from "lodash";
import { World, Family, AnyComponents, Entity, Components } from "../game/ecs";
import { AvatarArchetype, PickupArchetype } from "../game/ecs/Archetypes";
import { getPlayerAvatar } from "../game/Helpers";
import {
    ActionType,
    AvatarSpawnAction,
    runAction,
    Action,
    RemoveEntityAction,
    AmmoPackSpawnAction,
    AmmoPackPickupAction,
} from "../game/Action";
import { AvatarSpawnSystem } from "./AvatarSpawnSystem";
import { ProjectileDisposalSystem } from "../game/systems/ProjectileDisposalSystem";
import { PhysicsSystem } from "../game/systems/PhysicsSystem";
import { ProjectileDamageSystem } from "../game/systems/ProjectileDamageSystem";
import { GameContext } from "../game/GameContext";
import { WeaponType } from "../game/data/Weapon";
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
        this.world.addSystem(new AvatarSpawnSystem(this.world));
        this.world.addSystem(new ItemSpawnSystem(this));
        this.world.addSystem(new ItemPickupSystem(this));
        this.world.addSystem(new PhysicsSystem(this.world));
        this.world.addSystem(new ProjectileDamageSystem(this));
        this.world.addSystem(new ProjectileDisposalSystem(this.world));

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
                const spawnPeer = this.spawnAvatar(playerId, "enemy", position);
                player.socket.send(Action.serialize(spawnPeer));
            }
        });

        // Sync exisitng ammo pickups
        this.pickups.entities.forEach((pickup) => {
            const action: AmmoPackSpawnAction = {
                type: ActionType.AmmoPackSpawn,
                entityId: pickup.id,
                position: pickup.position,
                weaponType: pickup.pickup.weaponType,
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
                const avatarDeath = this.removeEntity(avatar.id);
                runAction(this.world, avatarDeath);
                this.broadcast(player.id, Action.serialize(avatarDeath));
            }
        }
    }

    public playerMessage(playerId: string, msg: string) {
        const action = Action.deserialize(msg);
        if (action === undefined) return;

        switch (action.type) {
            // Run & broadcast
            case ActionType.AvatarUpdate:
            case ActionType.EmitProjectile: {
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
                this.broadcastToAll(msg);

                if (target.health.value <= 0) {
                    const avatarId = action.targetId;
                    const avatarDeath = this.removeEntity(avatarId);
                    runAction(this.world, avatarDeath);
                    this.broadcastToAll(Action.serialize(avatarDeath));
                }

                return;
            }
        }
    }

    public broadcast(playerId: string, msg: string) {
        this.players.entities.forEach((player) => {
            if (player.id !== playerId) {
                player.socket.send(msg);
            }
        });
    }

    public broadcastToAll(msg: string) {
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

    public removeEntity(avatarId: string): RemoveEntityAction {
        return { type: ActionType.RemoveEntity, entityId: avatarId };
    }

    public spawnAmmoPack(position: Vector3, weaponType: WeaponType) {
        const action: AmmoPackSpawnAction = {
            type: ActionType.AmmoPackSpawn,
            entityId: uniqueId("pickup"),
            position,
            weaponType,
        };
        runAction(this.world, action);
        this.broadcastToAll(Action.serialize(action));
    }

    public pickupAmmoPack(avatarId: string, pickupId: string) {
        const action: AmmoPackPickupAction = {
            type: ActionType.AmmoPackPickup,
            avatarId,
            pickupId,
        };

        runAction(this.world, action);
        this.broadcastToAll(Action.serialize(action));
    }
}
