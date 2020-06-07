import { Vector3, Vector2 } from "three";
import { World } from "./ecs";
import { WeaponType, WEAPON_SPEC_RECORD } from "./data/Weapon";
import { EntityFactory } from "./data/EntityFactory";
import { padStart } from "lodash";
import { AvatarUpdateParcer, ActionParser } from "./ActionParsers";
import { getWeaponAmmo, getWeaponSpec } from "./Helpers";

export enum ActionType {
    PlaySound,
    SpawnDecal,
    AvatarSpawn,
    AvatarHit,
    AvatarUpdate,
    RemoveEntity,
    EmitProjectile,
    AmmoPackSpawn,
    AmmoPackPickup,
}

export interface PlaySoundAction {
    type: ActionType.PlaySound;
    sound: string;
    entityId: string;
}

export interface SpawnDecalAction {
    type: ActionType.SpawnDecal;
    point: Vector3;
    normal: Vector3;
}

export interface AvatarSpawnAction {
    type: ActionType.AvatarSpawn;
    playerId: string;
    avatarId: string;
    avatarType: "local" | "enemy";
    position: Vector3;
}

export interface AvatarHitAction {
    type: ActionType.AvatarHit;
    weaponType: WeaponType;
    shooterId: string;
    targetId: string;
    headshot: boolean;
}

export interface AvatarUpdateAction {
    type: ActionType.AvatarUpdate;
    avatarId: string;
    position: Vector3;
    velocity: Vector3;
    rotation: Vector2;
    weaponType: WeaponType;
}

export interface RemoveEntityAction {
    type: ActionType.RemoveEntity;
    entityId: string;
}

export interface EmitProjectileAction {
    readonly type: ActionType.EmitProjectile;
    projectileId: string;
    playerId: string;
    position: Vector3;
    velcotiy: Vector3;
}

export interface AmmoPackSpawnAction {
    readonly type: ActionType.AmmoPackSpawn;
    entityId: string;
    position: Vector3;
    weaponType: WeaponType;
}

export interface AmmoPackPickupAction {
    readonly type: ActionType.AmmoPackPickup;
    pickupId: string;
    avatarId: string;
}

export type Action =
    | PlaySoundAction
    | SpawnDecalAction
    | AvatarSpawnAction
    | AvatarHitAction
    | AvatarUpdateAction
    | RemoveEntityAction
    | EmitProjectileAction
    | AmmoPackSpawnAction
    | AmmoPackPickupAction;

export function runAction(world: World, action: Action) {
    switch (action.type) {
        case ActionType.AvatarSpawn: {
            const avatar =
                action.avatarType === "local"
                    ? EntityFactory.LocalAvatar(action.avatarId)
                    : EntityFactory.EnemyAvatar(action.avatarId);
            avatar.playerId = action.playerId;
            avatar.position.copy(action.position);
            world.addEntity(avatar);
            return;
        }

        case ActionType.RemoveEntity: {
            world.removeEntity(action.entityId);
            return;
        }

        case ActionType.AvatarUpdate: {
            const avatar = world.entities.get(action.avatarId);
            if (avatar === undefined) return;

            if (avatar.position !== undefined) {
                avatar.position.copy(action.position);
            }

            if (avatar.velocity !== undefined) {
                avatar.velocity.copy(action.velocity);
            }

            if (avatar.rotation !== undefined) {
                avatar.rotation.copy(action.rotation);
            }

            if (avatar.shooter !== undefined) {
                avatar.shooter.weaponType = action.weaponType;
            }
            return;
        }

        case ActionType.AvatarHit: {
            const shooter = world.entities.get(action.shooterId);
            if (shooter === undefined) return;
            if (shooter.shooter === undefined) return;
            if (shooter.position === undefined) return;

            const target = world.entities.get(action.targetId);
            if (target === undefined) return;
            if (target.health === undefined) return;
            if (target.health.value <= 0) return;

            const weaponSpec = WEAPON_SPEC_RECORD[action.weaponType];
            const damage = weaponSpec.bulletDamage;
            const headshot = action.headshot ? 3 : 1;

            target.health.value -= damage * headshot;
            target.health.value = Math.max(target.health.value, 0);

            if (target.cameraShake !== undefined) {
                target.cameraShake.setScalar(1);
            }

            if (target.hitIndicator !== undefined) {
                target.hitIndicator.show = true;
                target.hitIndicator.time = world.elapsedTime;
                target.hitIndicator.origin.copy(shooter.position);
            }

            return;
        }

        case ActionType.EmitProjectile: {
            const { projectileId, playerId, position, velcotiy } = action;
            const projectile = EntityFactory.Projectile(projectileId);
            projectile.projectile.spawnTime = world.elapsedTime;
            projectile.playerId = playerId;
            projectile.position.copy(position);
            projectile.velocity.copy(velcotiy);
            projectile.velocity.normalize();
            projectile.velocity.multiplyScalar(10);
            world.addEntity(projectile);
            return;
        }

        case ActionType.AmmoPackSpawn: {
            const pickup = EntityFactory.AmmoPikcup(action.weaponType);
            pickup.id = action.entityId;
            pickup.position.copy(action.position);
            world.addEntity(pickup);
            break;
        }

        case ActionType.AmmoPackPickup: {
            const pickup = world.entities.get(action.pickupId);
            if (pickup === undefined) return;
            if (pickup.pickup === undefined) return;

            const avatar = world.entities.get(action.avatarId);
            if (avatar === undefined) return;
            if (avatar.shooter === undefined) return;

            const { shooter } = avatar;
            const ammo = getWeaponAmmo({ shooter }, pickup.pickup.weaponType);
            const spec = getWeaponSpec({ shooter }, pickup.pickup.weaponType);
            if (ammo.reserved >= spec.maxReservedAmmo) {
                return;
            }

            world.removeEntity(pickup.id);
            ammo.reserved += 10;
            ammo.reserved = Math.min(ammo.reserved, spec.maxReservedAmmo);

            break;
        }
    }
}

export module Action {
    const parsers = new Map<ActionType, ActionParser>();
    parsers.set(ActionType.AvatarUpdate, new AvatarUpdateParcer());

    export function serialize(action: Action): string {
        const parser = parsers.get(action.type);
        const head = padStart(action.type.toString(), 2, "0");
        const body = parser ? parser.serialize(action) : JSON.stringify(action);
        return head + body;
    }

    export function deserialize(msg: string): Action | undefined {
        const head = parseInt(msg.slice(0, 2));
        if (ActionType[head] === undefined) return;

        const parser = parsers.get(head);
        const body = msg.slice(2);
        const action = parser ? parser.deserialize(body) : JSON.parse(body);
        return action;
    }
}
