import SocketIOClient from "socket.io-client";
import { Mesh, BoxGeometry, MeshBasicMaterial } from "three";
import { Input } from "./core/Input";
import { GameState } from "./game/GameState";
import { GameEvent } from "./game/GameEvent";
import { MeshSystem } from "./systems/MeshSystem";
import { ControllerSystem } from "./systems/ControllerSystem";
import { LocalPlayerSystem } from "./systems/LocalPlayerSystem";
import { findInMap } from "./core/Utils";

export class GameClient {
    private readonly input: Input;
    private readonly socket: SocketIOClient.Socket;
    private readonly gameState = new GameState();
    private readonly systems: Array<{
        update: (gameState: GameState, dt: number) => void;
    }>;

    public constructor(input: Input) {
        const url = location.origin.replace(location.port, "8080");
        this.input = input;
        this.socket = SocketIOClient.connect(url, {
            reconnection: false,
            autoConnect: false
        });

        this.systems = [
            new LocalPlayerSystem(this.socket),
            new ControllerSystem(this.input),
            new MeshSystem()
        ];
    }

    public get scene() {
        return this.gameState.scene;
    }

    public get camera() {
        const [avatar] = findInMap(this.gameState.avatars, avatar => {
            return avatar.isLocalPlayer;
        });

        if (avatar !== undefined) {
            return avatar.camera;
        }

        return this.gameState.camera;
    }

    public initSocket() {
        return new Promise(resolve => {
            this.socket.connect();

            this.socket.on("connect", () => {
                console.log("> Connection");
                resolve();
            });

            this.socket.on("dispatch", (event: GameEvent) => {
                console.log(`> dispatch::${event.type}`);
                this.gameState.dispatch(event);
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

    public update(dt: number) {
        this.systems.forEach(system => {
            system.update(this.gameState, dt);
        });
    }
}
