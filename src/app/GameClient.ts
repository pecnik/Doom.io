import SocketIOClient from "socket.io-client";
import { Input } from "./core/Input";
import { World } from "./world/World";

export class GameClient {
    public readonly input: Input;
    public readonly socket: SocketIOClient.Socket;
    public readonly world = new World();

    public constructor() {
        const url = location.origin.replace(location.port, "8080");
        this.input = new Input({ requestPointerLock: true });
        this.socket = SocketIOClient.connect(url, {
            reconnection: false,
            autoConnect: false
        });
    }

    public getActiveScene() {
        return this.world.scene;
    }

    public getActiveCamera() {
        return this.world.camera;
    }

    public connect() {
        return new Promise(resolve => {
            this.socket.connect();
            this.socket.on("connect", () => {
                console.log(`> Connection::${this.socket.id}`);
                resolve();
            });
        });
    }

    public onStart() {
        // ...
    }

    public update(_: number) {
        /// ....
        this.input.clear();
    }
}
