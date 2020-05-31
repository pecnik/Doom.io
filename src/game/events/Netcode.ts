import { Vector3 } from "three";

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
    public playerId = "";
    public position = new Vector3();
}

export interface SpawnEnemyAvatar {
    type: NetworkEventType.SpawnEnemyAvatar;
    playerId: string;
    position: Vector3;
}

export interface AvatarFrameSync {
    type: NetworkEventType.AvatarFrameSync;
    playerId: string;
    position: Vector3;
    veclotiy: Vector3;
    rotation: Vector3;
}

export function serialize(ev: NetworkEvent): string {
    return JSON.stringify(ev);
}

export function deserialize(msg: string): NetworkEvent {
    return JSON.parse(msg) as NetworkEvent;
}
