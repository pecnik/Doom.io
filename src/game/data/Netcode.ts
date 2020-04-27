import { World, Entity } from "../ecs";
import { EntityFactory } from "./EntityFactory";

export module Netcode {
    export type Ctx = { emit: (type: string, data: any) => void };

    export type Event =
        | PlayerSpawnEvent
        | EnemySpawnEvent
        | SyncPlayerTranslationEvent
        | SyncPlayerStatsEvent
        | HitEntityEvent
        | KillEntityEvent;

    export enum EventType {
        EnemySpawn,
        PlayerSpawn,
        SyncPlayerTranslationEvent,
        SyncPlayerStatsEvent,
        HitEntity,
        KillEntity,
    }

    export class PlayerSpawnEvent {
        public readonly type = EventType.PlayerSpawn;
        public id = "";
        public x = 0;
        public y = 0;
        public z = 0;
    }

    export class EnemySpawnEvent {
        public readonly type = EventType.EnemySpawn;
        public id = "";
        public x = 0;
        public y = 0;
        public z = 0;
    }

    export class HitEntityEvent {
        public readonly type = EventType.HitEntity;
        public attackerId = "";
        public targetId = "";
        public damage = 0;
        public weaponIindex = 0;
        public headshot = false;
    }

    export class SyncPlayerStatsEvent {
        public readonly type = EventType.SyncPlayerStatsEvent;
        public id = "";
        public hp = 0;
        public constructor(entity: Entity) {
            this.id = entity.id;
            this.hp = entity.health !== undefined ? entity.health.value : 0;
        }
    }

    export class SyncPlayerTranslationEvent {
        public readonly type = EventType.SyncPlayerTranslationEvent;
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

    export function dispatch(world: World, event: Event) {
        switch (event.type) {
            case EventType.PlayerSpawn: {
                const { id, x, y, z } = event;
                const player = EntityFactory.Player(id);
                player.position.set(x, y, z);
                world.addEntity(player);
                console.log(`> Dispatch::PlayerSpawn`);
                break;
            }

            case EventType.EnemySpawn: {
                const { id, x, y, z } = event;
                const enemy = EntityFactory.Enemy(id);
                enemy.position.set(x, y, z);
                world.addEntity(enemy);
                console.log(`> Dispatch::EnemySpawn`);
                break;
            }

            case EventType.SyncPlayerStatsEvent: {
                const { id, hp } = event;
                const entity = world.entities.get(id);
                if (entity === undefined) break;

                if (entity.health !== undefined) {
                    entity.health.value = hp;
                }

                console.log(`> Dispatch::SyncPlayerStatsEvent`);
                break;
            }

            case EventType.SyncPlayerTranslationEvent: {
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
