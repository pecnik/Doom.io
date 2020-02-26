import SocketIOClient from "socket.io-client";
import { Input } from "./core/Input";
import { World } from "./World";
import { ControllerSystem } from "./systems/ControllerSystem";
import { PhysicsSystem } from "./systems/PhysicsSystem";
import { CameraSystem } from "./systems/CameraSystem";
import { MeshSystem } from "./systems/MeshSystem";
import { Entity } from "@nova-engine/ecs";
import {
    PositionComponent,
    VelocityComponent,
    RotationComponent,
    LocalPlayerTag,
    JumpComponent,
    ModelComponent,
    SoundComponent,
    FootstepComponent
} from "./Components";
import { JumpingSystem } from "./systems/JumpingSystem";
import { SoundSystem } from "./systems/SoundSystem";
import { FootstepSystem } from "./systems/FootstepSystem";

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
        this.world.addSystem(new JumpingSystem(this.world, this.input));
        this.world.addSystem(new PhysicsSystem(this.world));
        this.world.addSystem(new MeshSystem(this.world));
        this.world.addSystem(new FootstepSystem(this.world));
        this.world.addSystem(new CameraSystem(this.world));
        this.world.addSystem(new SoundSystem(this.world));

        {
            // Spawn player
            const player = new Entity();
            player.id = "player-1";
            player.putComponent(LocalPlayerTag);
            player.putComponent(PositionComponent);
            player.putComponent(VelocityComponent);
            player.putComponent(RotationComponent);
            player.putComponent(FootstepComponent);
            player.putComponent(SoundComponent);
            player.putComponent(JumpComponent);

            const position = player.getComponent(PositionComponent);
            position.x = 3;
            position.z = 3;

            this.world.addEntity(player);
        }

        {
            // Spawn bot
            const bot = new Entity();
            bot.id = "bot";

            bot.putComponent(PositionComponent);
            bot.putComponent(RotationComponent);
            bot.putComponent(VelocityComponent);
            bot.putComponent(ModelComponent);
            bot.putComponent(SoundComponent);

            const position = bot.getComponent(PositionComponent);
            position.x = 3;
            position.z = 3;

            const sound = bot.getComponent(SoundComponent);
            sound.play = true;
            sound.src = "/assets/sounds/fire.wav";

            // setInterval(() => {
            //     const sound = bot.getComponent(SoundComponent);
            //     const rotation = bot.getComponent(RotationComponent);

            //     if (Math.random() < 0.25) {
            //         console.log(`> Bot::fire`);
            //         sound.play = true;
            //         sound.src = "/assets/sounds/fire.wav";
            //     } else if (Math.random() < 0.25) {
            //         console.log(`> Bot::turn-left`);
            //         rotation.y += 0.1;
            //     } else if (Math.random() < 0.25) {
            //         console.log(`> Bot::turn-right`);
            //         rotation.y -= 0.1;
            //     }
            // }, 1000);

            this.world.addEntity(bot);
        }
    }

    public update(dt: number) {
        this.world.elapsedTime += dt;
        this.world.update(dt);
        this.input.clear();
    }
}
