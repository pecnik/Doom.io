import { Vector3 } from "three";

export type GameEvent =
    | PlayerJoinEvent
    | PlayerLeftEvent
    | AvatarSpawnEvent
    | AvatarDeathEvent
    | AvatarUpdateEvent;

export enum GameEventType {
    PlayerJoinEvent,
    PlayerLeftEvent,
    AvatarSpawnEvent,
    AvatarDeathEvent,
    AvatarUpdateEvent
}

export class PlayerJoinEvent {
    public readonly type = GameEventType.PlayerJoinEvent;
    public readonly playerId: string;
    public constructor(playerId: string) {
        this.playerId = playerId;
    }
}

export class PlayerLeftEvent {
    public readonly type = GameEventType.PlayerLeftEvent;
    public readonly playerId: string;
    public constructor(playerId: string) {
        this.playerId = playerId;
    }
}

export class AvatarSpawnEvent {
    public readonly type = GameEventType.AvatarSpawnEvent;
    public readonly playerId: string;
    public readonly position: Vector3;
    public constructor(playerId: string, position: Vector3) {
        this.playerId = playerId;
        this.position = position;
    }
}

export class AvatarDeathEvent {
    public readonly type = GameEventType.AvatarDeathEvent;
    public readonly playerId: string;
    public constructor(playerId: string) {
        this.playerId = playerId;
    }
}

export class AvatarUpdateEvent {
    public readonly type = GameEventType.AvatarUpdateEvent;
}
