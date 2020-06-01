import { Vector3, Vector2 } from "three";
import { World } from "./ecs";
import { WeaponType, WEAPON_SPEC_RECORD } from "./data/Weapon";
import { EntityFactory } from "./data/EntityFactory";
import { padStart } from "lodash";
import { AvatarFrameUpdateParcer, ActionParser } from "./ActionParsers";

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

export module Action {
    const parsers = new Map<ActionType, ActionParser>();
    parsers.set(ActionType.AvatarFrameUpdate, new AvatarFrameUpdateParcer());

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
