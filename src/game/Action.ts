import { Vector3, Vector2 } from "three";
import { Entity } from "./ecs";
import { WeaponType } from "./data/Weapon";
import { padStart, random, uniqueId } from "lodash";
import { AvatarUpdateParcer, ActionParser } from "./ActionParsers";
import {
    getWeaponSpec,
    isScopeActive,
    getHeadingVector3,
    getHeadPosition,
} from "./Helpers";
import { LocalAvatarArchetype, PickupArchetype } from "./ecs/Archetypes";
import { PLAYER_RADIUS } from "./data/Globals";

export enum ActionType {
    PlaySound,
    SpawnDecal,
    AvatarSpawn,
    AvatarHit,
    AvatarUpdate,
    RemoveEntity,
    EmitProjectile,
    ItemSpawn,
    ItemPickup,
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

export interface ItemSpawnAction {
    readonly type: ActionType.ItemSpawn;
    entityId: string;
    pickup: PickupArchetype;
}

export interface ItemPickupAction {
    readonly type: ActionType.ItemPickup;
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
    | ItemSpawnAction
    | ItemPickupAction;

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

    export function playSound(
        entityId: string,
        sound: string
    ): PlaySoundAction {
        return {
            type: ActionType.PlaySound,
            entityId,
            sound,
        };
    }

    export function spawnDecal(
        point: Vector3,
        normal: Vector3
    ): SpawnDecalAction {
        return {
            type: ActionType.SpawnDecal,
            point,
            normal,
        };
    }

    export function hitAvatar(
        shooterId: string,
        targetId: string,
        headshot: boolean,
        weaponType: WeaponType
    ): AvatarHitAction {
        return {
            type: ActionType.AvatarHit,
            shooterId,
            targetId,
            weaponType,
            headshot,
        };
    }

    export function emitProjectile(
        avatar: Entity<LocalAvatarArchetype>
    ): EmitProjectileAction {
        const weaponSpec = getWeaponSpec(avatar);
        const steady = isScopeActive(avatar) ? 0.25 : 1;
        const spread = weaponSpec.spread * steady;
        const rotation = new Vector3(avatar.rotation.x, avatar.rotation.y, 0);
        rotation.x += random(-spread, spread, true);
        rotation.y += random(-spread, spread, true);

        const velcotiy = getHeadingVector3(rotation);

        const position = getHeadPosition(avatar);
        position.y -= 0.125; // Dunno
        position.x += velcotiy.x * PLAYER_RADIUS * 2;
        position.y += velcotiy.y * PLAYER_RADIUS * 2;
        position.z += velcotiy.z * PLAYER_RADIUS * 2;

        return {
            type: ActionType.EmitProjectile,
            projectileId: uniqueId(`${avatar.playerId}-pe`),
            playerId: avatar.playerId,
            position,
            velcotiy,
        };
    }

    export function spawnItemPickup(pickup: PickupArchetype): ItemSpawnAction {
        return {
            type: ActionType.ItemSpawn,
            entityId: uniqueId("pickup"),
            pickup,
        };
    }

    export function pickupItem(
        avatarId: string,
        pickupId: string
    ): ItemPickupAction {
        return {
            type: ActionType.ItemPickup,
            avatarId,
            pickupId,
        };
    }

    export function spawnAvatar(
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

    export function removeEntity(avatarId: string): RemoveEntityAction {
        return { type: ActionType.RemoveEntity, entityId: avatarId };
    }
}
