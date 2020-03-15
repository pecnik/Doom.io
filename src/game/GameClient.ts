import SocketIOClient from "socket.io-client";
import { Input } from "./core/Input";
import { World } from "./data/World";
import { PlayerInputSystem } from "./systems/PlayerInputSystem";
import { PlayerCameraSystem } from "./systems/PlayerCameraSystem";
import { EntityFactory } from "./utils/EntityFactory";
import { Comp } from "./data/Comp";
import { PlayerMoveSystem } from "./systems/PlayerMoveSystem";
import { CollisionSystem } from "./systems/CollisionSystem";
import { RenderSystem } from "./systems/RenderSystem";
import { AudioFootstepSystem } from "./systems/AudioFootstepSystem";
import { PlayerShootSystem } from "./systems/PlayerShootSystem";
import { AudioGunshotSystem } from "./systems/AudioGunshotSystem";
import { PlayerPovSystem } from "./systems/PlayerPovSystem";

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
            this.world.pov.load(),
            this.world.level.load(),
            this.world.decals.load(),

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
        // Systems
        this.world.addSystem(new PlayerInputSystem(this.world, this.input));
        this.world.addSystem(new PlayerMoveSystem(this.world));
        this.world.addSystem(new CollisionSystem(this.world));
        this.world.addSystem(new PlayerCameraSystem(this.world));
        this.world.addSystem(new PlayerShootSystem(this.world));
        this.world.addSystem(new PlayerPovSystem(this.world));
        this.world.addSystem(new RenderSystem(this.world));
        this.world.addSystem(new AudioGunshotSystem(this.world));
        this.world.addSystem(new AudioFootstepSystem(this.world));

        // Entities
        const player = EntityFactory.Player();
        player.getComponent(Comp.Position2D).set(3, 3);
        this.world.addEntity(player);

        const wall = EntityFactory.Wall();
        wall.getComponent(Comp.Position2D).set(11, 3);
        this.world.addEntity(wall);
    }

    public update(dt: number) {
        this.world.elapsedTime += dt;
        this.world.update(dt);
        this.input.clear();
    }
}
