import { Vector3, Vector2 } from "three";
import { World } from "./ecs";
import { WeaponType, WEAPON_SPEC_RECORD } from "./data/Weapon";
import { EntityFactory } from "./data/EntityFactory";
import { padStart } from "lodash";
import { ArrayBufferF32 } from "./data/ArrayBufferF32";

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
    interface Parser {
        serialize(ev: Action): string;
        deserialize(msg: string): Action;
    }

    const parsers = new Map<ActionType, Parser>();

    parsers.set(ActionType.AvatarFrameUpdate, {
        serialize(action: AvatarFrameUpdateAction): string {
            return JSON.stringify([
                action.avatarId,

                action.position.x,
                action.position.y,
                action.position.z,

                action.velocity.x,
                action.velocity.y,
                action.velocity.z,

                action.rotation.x,
                action.rotation.y,
            ]);
        },
        deserialize(msg: string): AvatarFrameUpdateAction {
            const [
                avatarId,

                positionX,
                positionY,
                positionZ,

                velocityX,
                velocityY,
                velocityZ,

                rotationX,
                rotationY,
            ] = JSON.parse(msg) as any[];

            return {
                type: ActionType.AvatarFrameUpdate,
                avatarId: avatarId,
                position: new Vector3(positionX, positionY, positionZ),
                velocity: new Vector3(velocityX, velocityY, velocityZ),
                rotation: new Vector2(rotationX, rotationY),
            };
        },
    });

    parsers.set(
        ActionType.AvatarFrameUpdate,
        new (class {
            public readonly float32 = new ArrayBufferF32(3 + 3 + 2);

            public serialize(action: AvatarFrameUpdateAction): string {
                this.float32.buffer[0] = action.position.x;
                this.float32.buffer[1] = action.position.y;
                this.float32.buffer[2] = action.position.z;
                this.float32.buffer[3] = action.velocity.x;
                this.float32.buffer[4] = action.velocity.y;
                this.float32.buffer[5] = action.velocity.z;
                this.float32.buffer[6] = action.rotation.x;
                this.float32.buffer[7] = action.rotation.y;
                return `${action.avatarId}¤${this.float32.toStringBuffer()}`;
            }

            public deserialize(msg: string): AvatarFrameUpdateAction {
                const index = msg.indexOf("¤");
                const avatarId = msg.slice(0, index);
                const buffer = msg.slice(index + 1);

                const action: AvatarFrameUpdateAction = {
                    type: ActionType.AvatarFrameUpdate,
                    avatarId: avatarId,
                    position: new Vector3(),
                    velocity: new Vector3(),
                    rotation: new Vector2(),
                };

                this.float32.readStringBuffer(buffer);
                action.position.x = this.float32.buffer[0];
                action.position.y = this.float32.buffer[1];
                action.position.z = this.float32.buffer[2];
                action.velocity.x = this.float32.buffer[3];
                action.velocity.y = this.float32.buffer[4];
                action.velocity.z = this.float32.buffer[5];
                action.rotation.x = this.float32.buffer[6];
                action.rotation.y = this.float32.buffer[7];

                return action;
            }
        })()
    );

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
