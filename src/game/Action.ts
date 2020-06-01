import { Vector3, Vector2 } from "three";
import { World } from "./ecs";
import { WeaponType, WEAPON_SPEC_RECORD } from "./data/Weapon";
import { EntityFactory } from "./data/EntityFactory";

export enum ActionType {
    PlaySound,
    SpawnDecal,
    AvatarSpawn,
    AvatarHit,
    AvatarFrameUpdate,
    AvatarDeath,
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
}

export interface AvatarFrameUpdateAction {
    type: ActionType.AvatarFrameUpdate;
    avatarId: string;
    position: Vector3;
    velocity: Vector3;
    rotation: Vector2;
}

export interface AvatarDeathAction {
    type: ActionType.AvatarDeath;
    avatarId: string;
}

export type Action =
    | PlaySoundAction
    | SpawnDecalAction
    | AvatarSpawnAction
    | AvatarHitAction
    | AvatarFrameUpdateAction
    | AvatarDeathAction;

export module Action {
    export function serialize(ev: Action): string {
        return JSON.stringify(ev);
    }

    export function deserialize(msg: string): Action {
        return JSON.parse(msg) as Action;
    }
}

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

        case ActionType.AvatarDeath: {
            world.removeEntity(action.avatarId);
            return;
        }

        case ActionType.AvatarFrameUpdate: {
            const avatar = world.entities.get(action.avatarId);
            if (avatar === undefined) return;
            if (avatar.position !== undefined)
                avatar.position.copy(action.position);
            if (avatar.velocity !== undefined)
                avatar.velocity.copy(action.velocity);
            if (avatar.rotation !== undefined)
                avatar.rotation.copy(action.rotation);
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
            target.health.value -= weaponSpec.bulletDamage;
            target.health.value = Math.max(target.health.value, 0);
            if (target.hitIndicator !== undefined) {
                target.hitIndicator.origin.copy(shooter.position);
            }
            return;
        }
    }
}
