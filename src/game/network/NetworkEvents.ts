import { Vector3, Vector2 } from "three";
import { World } from "../ecs";
import { EntityFactory } from "../data/EntityFactory";

export type NetworkEvent =
    | PlaySound
    | AvatarSpawn
    | AvatarFrameUpdate
    | AvatarDeath;

export module NetworkEvent {
    export function serialize(ev: NetworkEvent): string {
        return JSON.stringify(ev);
    }

    export function deserialize(msg: string): NetworkEvent {
        return JSON.parse(msg) as NetworkEvent;
    }
}

export enum NetworkEventType {
    PlaySound,
    AvatarSpawn,
    AvatarFrameUpdate,
    AvatarDeath,
}

export class PlaySound {
    public readonly type = NetworkEventType.PlaySound;
    public entityId: string;
    public sound: string;
    public constructor(entityId: string, sound: string) {
        this.entityId = entityId;
        this.sound = sound;
    }
}

export class AvatarSpawn {
    public readonly type = NetworkEventType.AvatarSpawn;
    public readonly playerId: string;
    public readonly avatarId: string;
    public readonly avatarType: "local" | "enemy";
    public readonly position: Vector3;
    public constructor(data: {
        playerId: string;
        avatarId: string;
        avatarType: "local" | "enemy";
        position: Vector3;
    }) {
        this.playerId = data.playerId;
        this.avatarId = data.avatarId;
        this.avatarType = data.avatarType;
        this.position = data.position;
    }

    public static execute(world: World, event: AvatarSpawn) {
        const avatar =
            event.avatarType === "local"
                ? EntityFactory.LocalAvatar(event.avatarId)
                : EntityFactory.EnemyAvatar(event.avatarId);
        avatar.playerId = event.playerId;
        avatar.position.copy(event.position);
        world.addEntity(avatar);
    }
}

export class AvatarFrameUpdate {
    public readonly type = NetworkEventType.AvatarFrameUpdate;
    public avatarId = "";
    public position = new Vector3();
    public velocity = new Vector3();
    public rotation = new Vector2();

    public static execute(world: World, event: AvatarFrameUpdate) {
        const avatar = world.entities.get(event.avatarId);
        if (avatar === undefined) return;
        if (avatar.position !== undefined) avatar.position.copy(event.position);
        if (avatar.velocity !== undefined) avatar.velocity.copy(event.velocity);
        if (avatar.rotation !== undefined) avatar.rotation.copy(event.rotation);
    }
}

export class AvatarDeath {
    public readonly type = NetworkEventType.AvatarDeath;
    public readonly avatarId: string;
    public constructor(data: { avatarId: string }) {
        this.avatarId = data.avatarId;
    }

    public static execute(world: World, event: AvatarDeath) {
        world.removeEntity(event.avatarId);
    }
}
