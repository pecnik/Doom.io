import SocketIOClient from "socket.io-client";
import { Input } from "./core/Input";
import {
    Mesh,
    BoxGeometry,
    MeshBasicMaterial,
    PerspectiveCamera,
    Scene
} from "three";

export class GameClient {
    public readonly input: Input;
    public readonly socket: SocketIOClient.Socket;
    public readonly scene = new Scene();
    public readonly camera = new PerspectiveCamera(90);

    public constructor() {
        const url = location.origin.replace(location.port, "8080");
        this.input = new Input({ requestPointerLock: true });
        this.socket = SocketIOClient.connect(url, {
            reconnection: false,
            autoConnect: false
        });
    }

    public connect() {
        return new Promise(resolve => {
            this.socket.connect();
            this.socket.on("connect", () => {
                console.log("> Connection");
                resolve();
            });
        });
    }

    public onStart() {
        console.log(`> TODO: load level`);
        console.log(`> TODO: connect to game`);

        const level = [
            [1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1]
        ];

        const tileGeo = new BoxGeometry(1, 1, 1);
        const tileMat = new MeshBasicMaterial({ wireframe: true });
        for (let z = 0; z < level.length; z++) {
            for (let x = 0; x < level[z].length; x++) {
                const tileId = level[z][x];
                if (tileId > 0) {
                    const tile = new Mesh(tileGeo, tileMat);
                    tile.position.set(x, 0, z);
                    this.scene.add(tile);
                }
            }
        }

        this.camera.position.x = level[0].length / 2;
        this.camera.position.z = level.length / 2;
    }

    public update(_: number) {
        /// ....
        this.input.clear();
    }
}
