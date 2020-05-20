import { World, Entity, Components } from "./ecs";
import { EntityFactory } from "./data/EntityFactory";
import { PlayerArchetype } from "./ecs/Archetypes";
import { Vector3 } from "three";
import { WeaponType } from "./data/Weapon";

export module Netcode {
    export type Ctx = { emit: (type: string, data: any) => void };

    export type Event =
        | CreatePlayer
        | DeletePlayer
        | SpawnPlayerAvatar
        | SpawnEnemyAvatar
        | SyncAvatar
        | SyncAvatarStats
        | HitEntity
        | KillEntityEvent
        | EmitSound;

    export enum EventType {
        CreatePlayer,
        DeletePlayer,
        SpawnEnemyAvatar,
        SpawnPlayerAvatar,
        SyncAvatar,
        SyncAvatarStats,
        HitEntity,
        KillEntity,
        EmitSound,
    }

    export class CreatePlayer {
        public readonly type = EventType.CreatePlayer;
        public readonly playerData: Components.PlayerData;
        public constructor(data: Components.PlayerData) {
            this.playerData = data;
        }
    }

    export class DeletePlayer {
        public readonly type = EventType.DeletePlayer;
        public readonly playerId: string;
        public constructor(playerId: string) {
            this.playerId = playerId;
        }
    }

    export class SpawnPlayerAvatar {
        public readonly type = EventType.SpawnPlayerAvatar;
        public readonly avatarId: string;
        public readonly playerId: string;
        public readonly x: number;
        public readonly y: number;
        public readonly z: number;

        public constructor(player: Entity<PlayerArchetype>, spawn: Vector3) {
            this.playerId = player.id;
            this.avatarId = `avt-${player.id}`;
            this.x = spawn.x;
            this.y = spawn.y;
            this.z = spawn.z;
        }
    }

    export class SpawnEnemyAvatar {
        public readonly type = EventType.SpawnEnemyAvatar;
        public readonly avatarId: string;
        public readonly playerId: string;
        public readonly x: number;
        public readonly y: number;
        public readonly z: number;

        public constructor(player: Entity<PlayerArchetype>, spawn: Vector3) {
            this.playerId = player.id;
            this.avatarId = `avt-${player.id}`;
            this.x = spawn.x;
            this.y = spawn.y;
            this.z = spawn.z;
        }
    }

    export class HitEntity {
        public readonly type = EventType.HitEntity;
        public attackerId = "";
        public targetId = "";
        public damage = 0;
        public weaponType = WeaponType.Pistol;
        public headshot = false;
    }

    export class SyncAvatarStats {
        public readonly type = EventType.SyncAvatarStats;
        public id = "";
        public hp = 0;
        public constructor(entity: Entity) {
            this.id = entity.id;
            this.hp = entity.health !== undefined ? entity.health.value : 0;
        }
    }

    export class SyncAvatar {
        public readonly type = EventType.SyncAvatar;
        public id = "";

        public px = 0;
        public py = 0;
        public pz = 0;

        public vx = 0;
        public vy = 0;
        public vz = 0;

        public rx = 0;
        public ry = 0;
    }

    export class KillEntityEvent {
        public readonly type = EventType.KillEntity;
        public id = "";
        public constructor(entity: Entity) {
            this.id = entity.id;
        }
    }

    export class EmitSound {
        public readonly type = EventType.EmitSound;
        public readonly id: string;
        public readonly sound: string;
        public constructor(id: string, sound: string) {
            this.id = id;
            this.sound = sound;
        }
    }

    export function dispatch(world: World, event: Event) {
        switch (event.type) {
            case EventType.CreatePlayer: {
                const { playerData } = event;
                const { id } = playerData;
                const player = { ...new PlayerArchetype(), playerData, id };
                world.addEntity(player);
                console.log(`> Dispatch::CreatePlayer(${id})`);
                break;
            }

            case EventType.DeletePlayer: {
                const { playerId } = event;
                const ownedByPlayer: string[] = [playerId];
                world.entities.forEach((entity) => {
                    if (entity.playerId === playerId) {
                        ownedByPlayer.push(entity.id);
                    }
                });
                ownedByPlayer.forEach((id) => world.removeEntity(id));
                console.log(`> Dispatch::DeletePlayer(${playerId})`);
                break;
            }

            case EventType.SpawnPlayerAvatar: {
                const { avatarId, playerId, x, y, z } = event;
                const avatar = EntityFactory.LocalAvatar(avatarId);
                avatar.playerId = playerId;
                avatar.position.set(x, y, z);
                world.addEntity(avatar);
                console.log(`> Dispatch::SpawnPlayerAvatar`);
                break;
            }

            case EventType.SpawnEnemyAvatar: {
                const { avatarId, playerId, x, y, z } = event;
                const avatar = EntityFactory.EnemyAvatar(avatarId);
                avatar.playerId = playerId;
                avatar.position.set(x, y, z);
                world.addEntity(avatar);
                console.log(`> Dispatch::SpawnEnemyAvatar`);
                break;
            }

            case EventType.SyncAvatarStats: {
                const { id, hp } = event;
                const entity = world.entities.get(id);
                if (entity === undefined) break;

                if (entity.health !== undefined) {
                    entity.health.value = hp;
                }

                console.log(`> Dispatch::SyncPlayerStatsEvent`);
                break;
            }

            case EventType.SyncAvatar: {
                const { id, px, py, pz, vx, vy, vz, rx, ry } = event;
                const entity = world.entities.get(id);
                if (entity === undefined) break;

                if (entity.position !== undefined) {
                    entity.position.set(px, py, pz);
                }

                if (entity.velocity !== undefined) {
                    entity.velocity.set(vx, vy, vz);
                }

                if (entity.rotation !== undefined) {
                    entity.rotation.set(rx, ry);
                }

                break;
            }

            case EventType.KillEntity: {
                world.removeEntity(event.id);
                console.log(`> Dispatch::KillEntity`);
                break;
            }
        }
    }
}
