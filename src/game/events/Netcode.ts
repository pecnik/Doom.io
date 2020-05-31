import { Vector3, Vector2 } from "three";
import { Entity } from "../ecs";
import { AvatarArchetype } from "../ecs/Archetypes";

export type NetworkEvent =
    | AvatarFrameSync
    | SpawnLocalAvatar
    | SpawnEnemyAvatar;

export enum NetworkEventType {
    SpawnLocalAvatar,
    SpawnEnemyAvatar,
    AvatarFrameSync,
}

export class SpawnLocalAvatar {
    public readonly type = NetworkEventType.SpawnLocalAvatar;
    public readonly playerId: string;
    public readonly position: Vector3;
    public constructor(avatar: Entity<AvatarArchetype>) {
        this.playerId = avatar.id;
        this.position = avatar.position.clone();
    }
}

export class SpawnEnemyAvatar {
    public readonly type = NetworkEventType.SpawnEnemyAvatar;
    public readonly playerId: string;
    public readonly position: Vector3;
    public constructor(avatar: Entity<AvatarArchetype>) {
        this.playerId = avatar.id;
        this.position = avatar.position.clone();
    }
}

export class AvatarFrameSync {
    public readonly type = NetworkEventType.AvatarFrameSync;
    public playerId = "";
    public position = new Vector3();
    public velocity = new Vector3();
    public rotation = new Vector2();
}

export function serialize(ev: NetworkEvent): string {
    return JSON.stringify(ev);
}

export function deserialize(msg: string): NetworkEvent {
    return JSON.parse(msg) as NetworkEvent;
}
