import { Vector3, Vector2 } from "three";
import { Entity, Components } from "./ecs";
import { WeaponType } from "./data/Weapon";
import { padStart, random, uniqueId } from "lodash";
import { AvatarUpdateParcer, ActionParser } from "./ActionParsers";
import {
    getWeaponSpec,
    isScopeActive,
    getHeadingVector3,
    getHeadPosition,
} from "./Helpers";
import { LocalAvatarArchetype } from "./ecs/Archetypes";
import { PLAYER_RADIUS } from "./data/Globals";

export enum ActionType {
    SpawnPlayer,
    SpawnAvatar,
    SpawnAmmoPack,
    SpawnHealthPack,
    PlaySound,
    SpawnDecal,
    AvatarHit,
    AvatarUpdate,
    RemoveEntity,
    EmitProjectile,
    ConsumePickup,
    UpdateKillLog,
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

export interface ConsumePickupAction {
    readonly type: ActionType.ConsumePickup;
    pickupId: string;
    avatarId: string;
}

export interface SpawnPlayerAction {
    readonly type: ActionType.SpawnPlayer;
    playerId: string;
    data: Components.PlayerData;
}

export interface SpawnAvatarAction {
    readonly type: ActionType.SpawnAvatar;
    playerId: string;
    avatarId: string;
    avatarType: "local" | "enemy";
    position: Vector3;
}

export interface SpawnAmmoPackAction {
    readonly type: ActionType.SpawnAmmoPack;
    id: string;
    ammo: number;
    position: Vector3;
    weaponType: WeaponType;
}

export interface SpawnHealthPackAction {
    readonly type: ActionType.SpawnHealthPack;
    id: string;
    heal: number;
    position: Vector3;
}

export interface UpdateKillLogAction {
    readonly type: ActionType.UpdateKillLog;
    killerPlayerId: string;
    victimPlayerId: string;
}

export type Action =
    | SpawnPlayerAction
    | SpawnAvatarAction
    | SpawnAmmoPackAction
    | SpawnHealthPackAction
    | PlaySoundAction
    | SpawnDecalAction
    | AvatarHitAction
    | AvatarUpdateAction
    | RemoveEntityAction
    | EmitProjectileAction
    | ConsumePickupAction
    | UpdateKillLogAction;

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

    export function spawnPlayer(
        playerId: string,
        data: Components.PlayerData
    ): SpawnPlayerAction {
        return {
            type: ActionType.SpawnPlayer,
            playerId,
            data,
        };
    }

    export function spawnAvatar(
        playerId: string,
        avatarType: "local" | "enemy",
        position = new Vector3()
    ): SpawnAvatarAction {
        const avatarId = "a" + playerId;
        position = position || new Vector3();
        return {
            type: ActionType.SpawnAvatar,
            playerId,
            avatarId,
            avatarType,
            position,
        };
    }

    export function spawnAmmoPack(
        id: string,
        position: Vector3,
        weaponType: WeaponType,
        ammo = 10
    ): SpawnAmmoPackAction {
        return {
            type: ActionType.SpawnAmmoPack,
            id,
            ammo,
            position,
            weaponType,
        };
    }

    export function spawnHealthPack(
        id: string,
        position: Vector3,
        heal = 15
    ): SpawnHealthPackAction {
        return {
            type: ActionType.SpawnHealthPack,
            id,
            heal,
            position,
        };
    }

    export function consumePickup(
        avatarId: string,
        pickupId: string
    ): ConsumePickupAction {
        return {
            type: ActionType.ConsumePickup,
            avatarId,
            pickupId,
        };
    }

    export function removeEntity(avatarId: string): RemoveEntityAction {
        return { type: ActionType.RemoveEntity, entityId: avatarId };
    }
}
