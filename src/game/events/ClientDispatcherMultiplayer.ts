import { ClientDispatcher } from "./ClientDispatcher";
import { World } from "../ecs";
import {
    deserialize,
    NetworkEventType,
    AvatarFrameSync,
    serialize,
} from "./Netcode";
import { EntityFactory } from "../data/EntityFactory";

const url = location.origin
    .replace(location.port, "8080")
    .replace("http://", "ws://")
    .replace("https://", "ws://");

export class ClientDispatcherMultiplayer extends ClientDispatcher {
    public readonly socket = new WebSocket(url);

    public constructor(world: World) {
        super(world);
        this.socket.onmessage = this.onMessage.bind(this);
    }

    public avatarFrameSync(sync: AvatarFrameSync) {
        this.socket.send(serialize(sync));
    }

    private onMessage(msg: MessageEvent) {
        const ev = deserialize(msg.data);

        switch (ev.type) {
            case NetworkEventType.SpawnLocalAvatar: {
                const avatar = EntityFactory.LocalAvatar(ev.playerId);
                avatar.position.copy(ev.position);
                this.world.addEntity(avatar);
                return;
            }

            case NetworkEventType.SpawnEnemyAvatar: {
                const avatar = EntityFactory.EnemyAvatar(ev.playerId);
                avatar.position.copy(ev.position);
                this.world.addEntity(avatar);
                return;
            }

            case NetworkEventType.AvatarFrameSync: {
                const avatar = this.world.entities.get(ev.playerId);
                if (avatar === undefined) return;

                if (avatar.position !== undefined) {
                    avatar.position.copy(ev.position);
                }

                if (avatar.velocity !== undefined) {
                    avatar.velocity.copy(ev.velocity);
                }

                if (avatar.rotation !== undefined) {
                    avatar.rotation.copy(ev.rotation);
                }

                return;
            }
        }
    }
}
