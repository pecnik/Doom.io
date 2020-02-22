import SocketIOClient from "socket.io-client";
import { Input } from "./core/Input";
import { World } from "./World";
import { ControllerSystem } from "./systems/ControllerSystem";
import { MeshSystem } from "./systems/MeshSystem";
import { Entity } from "@nova-engine/ecs";
import {
    PositionComponent,
    VelocityComponent,
    RotationComponent,
    ModelComponent,
    LocalPlayerTag
} from "./Components";

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

    public initialize() {
        return Promise.all([
            // Load level
            this.world.level.load(),

            // Connect to the server
            new Promise(resolve => {
                this.socket.connect();
                this.socket.on("connect", () => {
                    console.log(`> Connection::${this.socket.id}`);
                    resolve();
                });
            })
        ]);
    }

    public onStart() {
        this.world.addSystem(new ControllerSystem(this.world, this.input));
        this.world.addSystem(new MeshSystem(this.world));

        const player = new Entity();
        player.id = "player-1";
        player.putComponent(LocalPlayerTag);
        player.putComponent(PositionComponent);
        player.putComponent(VelocityComponent);
        player.putComponent(RotationComponent);

        player.getComponent(RotationComponent).x = -0.8;
        player.getComponent(RotationComponent).y = Math.PI * 1.2;

        this.world.addEntity(player);

        for (let i = 0; i < 3; i++) {
            const enemy = new Entity();
            enemy.id = `enemay-${i}`;

            const position = enemy.putComponent(PositionComponent);
            position.x = Math.random() * 5;
            position.z = Math.random() * 5;

            enemy.putComponent(VelocityComponent);
            enemy.putComponent(RotationComponent);
            enemy.putComponent(ModelComponent);

            this.world.addEntity(enemy);
        }
    }

    public update(dt: number) {
        this.world.update(dt);
        this.input.clear();
    }
}
