import fs from "fs";
import WebSocket from "ws";
import { Clock } from "three";
import { uniqueId } from "lodash";
import { World, Family, Entity, Components } from "../game/ecs";
import {
    AvatarArchetype,
    AmmoPackArchetype,
    HealthArchetype,
    PlayerArchetype,
} from "../game/ecs/Archetypes";
import { getPlayerAvatar } from "../game/Helpers";
import { ActionType, Action, UpdateKillLogAction } from "../game/Action";
import { AvatarSpawnSystem } from "./AvatarSpawnSystem";
import { ProjectileDisposalSystem } from "../game/systems/ProjectileDisposalSystem";
import { PhysicsSystem } from "../game/systems/PhysicsSystem";
import { ProjectileDamageSystem } from "../game/systems/ProjectileDamageSystem";
import { GameContext } from "../game/GameContext";
import { PickupSpawnSystem } from "../game/systems/PickupSpawnSystem";
import { PickupConsumeSystem } from "../game/systems/PickupConsumeSystem";

/**
 * Server-side player entity archetype
 */
export class ServerPlayerArchetype extends PlayerArchetype {
    public readonly socket: WebSocket = {} as WebSocket;
    public readonly respawn = new Components.Respawn();
}

export class GameServer extends GameContext {
    public readonly world = new World();
    public readonly wss: WebSocket.Server;
    public readonly clock = new Clock();

    public readonly avatars = Family.findOrCreate(new AvatarArchetype());

    // Player entity archetype shared with the client
    public readonly players = Family.findOrCreate(new PlayerArchetype());

    // Are just players with a websocket component
    public readonly serverPlayers = Family.findOrCreate(
        new ServerPlayerArchetype()
    );

    public readonly ammoPacks = Family.findOrCreate(new AmmoPackArchetype());
    public readonly healthPacks = Family.findOrCreate(new HealthArchetype());

    public constructor(wss: WebSocket.Server) {
        super();

        // Init level
        const levelPath = __dirname + "/../../assets/levels/arena.json";
        const levelJson = fs.readFileSync(levelPath);
        this.world.level.readJson(JSON.parse(String(levelJson)));

        // Init systems
        this.world.addSystem(new AvatarSpawnSystem(this));
        this.world.addSystem(new PickupSpawnSystem(this));
        this.world.addSystem(new PickupConsumeSystem(this));
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
        this.serverPlayers.entities.forEach((player) => {
            if (player.socket.readyState === player.socket.OPEN) {
                player.socket.send(msg);
            }
        });
    }

    public runDispatch(action: Action) {
        super.runDispatch(action);

        switch (action.type) {
            case ActionType.AvatarHit: {
                const target = this.avatars.entities.get(action.targetId);
                if (target === undefined) return;
                if (target.health.value <= 0) {
                    const kAvatar = this.avatars.entities.get(action.shooterId);
                    const vAvatar = this.avatars.entities.get(action.targetId);
                    this.dispatch(Action.removeEntity(action.targetId));

                    // TODO - streamline action data?
                    if (kAvatar === undefined) return;
                    if (vAvatar === undefined) return;

                    const killer = this.players.entities.get(kAvatar.playerId);
                    const victim = this.players.entities.get(vAvatar.playerId);
                    if (killer === undefined) return;
                    if (victim === undefined) return;

                    const killLog: UpdateKillLogAction = {
                        type: ActionType.UpdateKillLog,
                        killerPlayerId: kAvatar.playerId,
                        victimPlayerId: vAvatar.playerId,
                        killCount: killer.playerData.kills + 1,
                        deathCount: victim.playerData.deaths + 1,
                        weaponType: action.weaponType,
                    };
                    this.dispatch(killLog);
                }

                return;
            }
        }
    }

    private playerConnection(socket: WebSocket) {
        // Create player connection enetiy
        const id = uniqueId("p");
        const player: Entity<ServerPlayerArchetype> = {
            ...new ServerPlayerArchetype(),
            id,
            socket,
        };

        player.playerId = id;
        player.playerData.name = "";
        player.playerData.kills = 0;
        player.playerData.deaths = 0;

        this.world.addEntity(player);
        console.log(`> Server::playerConnection(${id})`);

        return id;
    }

    private playerDisconnect(playerId: string) {
        const player = this.serverPlayers.entities.get(playerId);
        if (player !== undefined) {
            this.dispatch(Action.removeEntity(playerId));
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

            case ActionType.RegisterPlayer: {
                const player = this.serverPlayers.entities.get(playerId);
                if (player === undefined) return;
                if (player.playerData.name !== "") return;

                // Set name
                player.playerData.name = action.name || "noname";

                // Sync existing entities
                this.serverPlayers.entities.forEach((peer) => {
                    const spawnPlayer = Action.spawnPlayer(
                        peer.id,
                        peer.playerData
                    );
                    player.socket.send(Action.serialize(spawnPlayer));

                    if (peer.id !== player.id) {
                        const spawnPlayer = Action.spawnPlayer(
                            player.id,
                            player.playerData
                        );
                        peer.socket.send(Action.serialize(spawnPlayer));
                    }

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
                this.ammoPacks.entities.forEach((pickup) => {
                    const action = Action.spawnAmmoPack(
                        pickup.id,
                        pickup.position,
                        pickup.pickupAmmo.weaponType,
                        pickup.pickupAmmo.ammo
                    );
                    player.socket.send(Action.serialize(action));
                });

                // Sync exisitng health pickups
                this.healthPacks.entities.forEach((pickup) => {
                    const action = Action.spawnHealthPack(
                        pickup.id,
                        pickup.position,
                        pickup.pickupHealth.heal
                    );
                    player.socket.send(Action.serialize(action));
                });

                return;
            }
        }
    }

    private forwardDispatch(playerId: string, msg: string) {
        this.serverPlayers.entities.forEach((player) => {
            if (player.id !== playerId) {
                player.socket.send(msg);
            }
        });
    }
}
