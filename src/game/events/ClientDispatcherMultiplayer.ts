import { ClientDispatcher } from "./ClientDispatcher";
import { World } from "../ecs";
import { deserialize, NetworkEventType } from "./Netcode";
import { EntityFactory } from "../data/EntityFactory";

const url = location.origin
    .replace(location.port, "8080")
    .replace("http://", "ws://")
    .replace("https://", "ws://");

export class ClientDispatcherMultiplayer extends ClientDispatcher {
    public readonly ws = new WebSocket(url);

    public constructor(world: World) {
        super(world);
        this.ws.onmessage = this.onMessage.bind(this);
    }

    private onMessage(msg: MessageEvent) {
        const ev = deserialize(msg.data);
        console.log({ ev });
        switch (ev.type) {
            case NetworkEventType.SpawnLocalAvatar: {
                const avatar = EntityFactory.LocalAvatar(ev.playerId);
                avatar.position.copy(ev.position);
                this.world.addEntity(avatar);
                break;
            }

            case NetworkEventType.SpawnEnemyAvatar: {
                const avatar = EntityFactory.EnemyAvatar(ev.playerId);
                avatar.position.copy(ev.position);
                this.world.addEntity(avatar);
                break;
            }

            default:
                break;
        }
    }
}
