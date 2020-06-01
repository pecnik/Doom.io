import { NetworkEvent, PlaySound, NetworkEventType } from "./NetworkEvents";

export class ClientNetwork {
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

    public playSound() {
        const playSound = new PlaySound();
        this.handleEvent(playSound);
        this.sendMessage(playSound);
    }

    private sendMessage(_event: NetworkEvent) {}

    private handleEvent(event: NetworkEvent) {
        switch (event.type) {
            case NetworkEventType.AvatarSpawn: {
                break;
            }

            case NetworkEventType.AvatarDeath: {
                break;
            }

            case NetworkEventType.AvatarFrameUpdate: {
                break;
            }
        }
    }
}
