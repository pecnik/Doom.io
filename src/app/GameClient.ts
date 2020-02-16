import SocketIOClient from "socket.io-client";
import { Mesh, BoxGeometry, MeshBasicMaterial, Vector3 } from "three";
import { Input, KeyCode } from "./core/Input";
import { modulo } from "./core/Utils";
import { GameState } from "./game/GameState";
import { GameEvent } from "./game/GameEvent";
import { Renderer } from "./core/Renderer";

export class GameClient {
    private readonly gameState = new GameState();

    private readonly input: Input;
    private readonly socket: SocketIOClient.Socket;

    public constructor(input: Input) {
        const url = location.origin.replace(location.port, "8080");
        this.socket = SocketIOClient.connect(url, {
            reconnection: false,
            autoConnect: false
        });

        this.input = input;
    }

    public get scene() {
        return this.gameState.scene;
    }

    public get camera() {
        return this.gameState.camera;
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

        this.socket.connect();
        this.socket.on("connect", () => {
            console.log("> Connection");
        });
        this.socket.on("dispatch", (event: GameEvent) => {
            console.log(`> dispatch::${event.type}`);
            this.gameState.dispatch(event);
        });
    }

    public update(dt: number) {
        const mouseSensitivity = 0.1;
        const lookHor = this.input.mouse.dx;
        this.camera.rotation.y -= lookHor * mouseSensitivity * dt;
        this.camera.rotation.y = modulo(this.camera.rotation.y, Math.PI * 2);

        const forward = this.input.isKeyDown(KeyCode.W);
        const backward = this.input.isKeyDown(KeyCode.S);
        const left = this.input.isKeyDown(KeyCode.A);
        const right = this.input.isKeyDown(KeyCode.D);

        const velocity = new Vector3();
        velocity.z -= forward ? 1 : 0;
        velocity.z += backward ? 1 : 0;
        velocity.x -= left ? 1 : 0;
        velocity.x += right ? 1 : 0;

        if (velocity.length() > 0) {
            const facingAngle = this.camera.rotation.y;
            const angle = Math.atan2(velocity.z, velocity.x) - facingAngle;
            velocity.z = Math.sin(angle);
            velocity.x = Math.cos(angle);
        }

        const movementSpeed = 5;
        velocity.normalize();
        velocity.multiplyScalar(movementSpeed * dt);

        this.camera.position.add(velocity);
    }

    public render(renderer: Renderer) {}
}
