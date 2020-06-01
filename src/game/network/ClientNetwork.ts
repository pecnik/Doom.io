import {
    NetworkEvent,
    PlaySound,
    NetworkEventType,
    AvatarSpawn,
    AvatarFrameUpdate,
    AvatarDeath,
    SpawnDecal,
    AvatarHit,
} from "./NetworkEvents";
import { GameClient } from "../GameClient";
import { Sound2D } from "../sound/Sound2D";
import { Sound3D } from "../sound/Sound3D";
import { Vector3 } from "three";
import { WeaponType } from "../data/Weapon";

export class ClientNetwork {
    private readonly client: GameClient;

    public constructor(client: GameClient) {
        this.client = client;
    }

    public connect() {
        const url = location.origin
            .replace(location.port, "8080")
            .replace("http://", "ws://")
            .replace("https://", "ws://");

        const socket = new WebSocket(url);

        socket.onmessage = (ev) => {
            const msg = ev.data as string;
            const event = NetworkEvent.deserialize(msg);
            this.handleEvent(event);
        };

        socket.onclose = () => {
            this.sendMessage = () => {};
        };

        this.sendMessage = (event: NetworkEvent) => {
            socket.send(NetworkEvent.serialize(event));
        };
    }

    public sendMessage(_event: NetworkEvent) {
        // is overwritten on connect()
    }

    public playSound(entityId: string, sound: string) {
        const playSound = new PlaySound(entityId, sound);
        this.handleEvent(playSound);
        this.sendMessage(playSound);
    }

    public spawnDecal(point: Vector3, normal: Vector3) {
        const spawnDecal = new SpawnDecal(point, normal);
        this.handleEvent(spawnDecal);
        this.sendMessage(spawnDecal);
    }

    public hitAvatar(
        shooterId: string,
        targetId: string,
        weaponType: WeaponType
    ) {
        const hitAvatar = new AvatarHit({ shooterId, targetId, weaponType });
        this.handleEvent(hitAvatar);
        this.sendMessage(hitAvatar);
    }

    private handleEvent(event: NetworkEvent) {
        switch (event.type) {
            case NetworkEventType.AvatarSpawn: {
                AvatarSpawn.execute(this.client.world, event);
                return;
            }

            case NetworkEventType.AvatarDeath: {
                AvatarDeath.execute(this.client.world, event);
                return;
            }

            case NetworkEventType.AvatarHit: {
                AvatarHit.execute(this.client.world, event);
                return;
            }

            case NetworkEventType.AvatarFrameUpdate: {
                AvatarFrameUpdate.execute(this.client.world, event);
                return;
            }

            case NetworkEventType.PlaySound: {
                const { entityId, sound } = event;
                const entity = this.client.world.entities.get(entityId);
                if (entity === undefined) return;
                if (entity.position === undefined) return;

                if (entity.localAvatarTag === true) {
                    Sound2D.get(sound).play();
                } else {
                    Sound3D.get(sound).emitFrom(entity);
                }
                return;
            }

            case NetworkEventType.SpawnDecal: {
                this.client.world.decals.spawn(event.point, event.normal);
                return;
            }
        }
    }
}
