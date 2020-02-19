import { System } from "@nova-engine/ecs";
import { World } from "../../World";
import { Action } from "../../Actions";

export class NetworkSystem extends System {
    private readonly socket: SocketIOClient.Socket;

    public constructor(_: World, socket: SocketIOClient.Socket) {
        super();
        this.socket = socket;
    }

    public onAttach(world: World) {
        this.socket.on("dispatch", (action: Action) => {
            world.dispatch(action);
        });
    }

    public update() {
        // ...
    }
}
