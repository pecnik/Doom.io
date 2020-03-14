import SocketIOClient from "socket.io-client";
import { Input } from "./core/Input";
import { World } from "./data/World";
import { PositionComponent } from "./data/Components";
import { MovementSystem } from "./systems/MovementSystem";
import { PhysicsSystem } from "./systems/PhysicsSystem";
import { CameraSystem } from "./systems/CameraSystem";
import { MeshSystem } from "./systems/MeshSystem";
import { JumpingSystem } from "./systems/JumpingSystem";
import { ShootingSystem } from "./systems/ShootingSystem";
import { SoundSystem } from "./systems/SoundSystem";
import { FootstepSystem } from "./systems/FootstepSystem";
import { BulletDecalSystem } from "./systems/BulletDecalSystem";
import { ParticleSystem } from "./systems/ParticleSystem";
import { PovSystem } from "./systems/PovSystem";
import { InputSystem } from "./systems/InputSystem";
import { EntityFactory } from "./data/EntityFactory";

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
        // Set systems
        this.world.addSystem(new InputSystem(this.world, this.input));
        this.world.addSystem(new MovementSystem(this.world));
        this.world.addSystem(new JumpingSystem(this.world));
        this.world.addSystem(new PhysicsSystem(this.world));
        this.world.addSystem(new ShootingSystem(this.world));
        this.world.addSystem(new FootstepSystem(this.world));
        this.world.addSystem(new MeshSystem(this.world));
        this.world.addSystem(new CameraSystem(this.world));
        this.world.addSystem(new SoundSystem(this.world));
        this.world.addSystem(new BulletDecalSystem(this.world));
        this.world.addSystem(new ParticleSystem(this.world));
        this.world.addSystem(new PovSystem(this.world));

        // Spawn entities
        const player = EntityFactory.Player();
        const box = EntityFactory.Box();
        const block = EntityFactory.Block();
        const meatBox = EntityFactory.MeatBox();

        player.getComponent(PositionComponent).set(3, 0, 3);
        meatBox.getComponent(PositionComponent).set(11, 0, 3);
        block.getComponent(PositionComponent).set(11, 0, 5);
        box.getComponent(PositionComponent).set(11, 0, 7);

        this.world.addEntity(player);
        this.world.addEntity(meatBox);
        this.world.addEntity(block);
        this.world.addEntity(box);
    }

    public update(dt: number) {
        this.world.elapsedTime += dt;
        this.world.update(dt);
        this.input.clear();
    }
}
