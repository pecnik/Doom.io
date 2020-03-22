import SocketIOClient from "socket.io-client";
import { Hud } from "./data/Hud";
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
import { HudWeaponSystem } from "./systems/HudWeaponSystem";
import { AudioListener, AudioLoader, TextureLoader } from "three";
import { HudDisplaySystem } from "./systems/HudDisplaySystem";
import { WeaponSpecs } from "./data/Weapon";

export class GameClient {
    public readonly input: Input;
    public readonly socket: SocketIOClient.Socket;
    public readonly world = new World();
    public readonly hud = new Hud();

    public constructor() {
        const url = location.origin.replace(location.port, "8080");
        this.input = new Input({ requestPointerLock: true });
        this.socket = SocketIOClient.connect(url, {
            reconnection: false,
            autoConnect: false
        });
    }

    public initialize() {
        return Promise.all([
            this.world.level.load(),
            this.world.decals.load(),

            // Connect to the server
            new Promise(resolve => {
                this.socket.connect();
                this.socket.on("connect", () => {
                    console.log(`> Connection::${this.socket.id}`);
                    resolve();
                });
            }),

            // Preload weapon sprite
            ...WeaponSpecs.map(weapon => {
                return new Promise(resolve => {
                    new TextureLoader().load(weapon.povSpriteSrc, texture => {
                        weapon.povSpriteTexture = texture;
                        resolve();
                    });
                });
            }),

            // Preload weapon audio
            ...WeaponSpecs.map(weapon => {
                return new Promise(resolve => {
                    new AudioLoader().load(weapon.fireSoundSrc, buffer => {
                        weapon.fireSoundBuffer = buffer;
                        resolve();
                    });
                });
            })
        ]);
    }

    public onStart() {
        // Audio listener
        this.world.listener = new AudioListener();
        this.world.camera.add(this.world.listener);

        // Systems
        this.world.addSystem(new PlayerInputSystem(this.world, this.input));
        this.world.addSystem(new PlayerMoveSystem(this.world));
        this.world.addSystem(new CollisionSystem(this.world));
        this.world.addSystem(new PlayerCameraSystem(this.world));
        this.world.addSystem(new PlayerShootSystem(this.world));
        this.world.addSystem(new RenderSystem(this.world));

        this.world.addSystem(new HudDisplaySystem(this.world, this.hud));
        this.world.addSystem(new HudWeaponSystem(this.world, this.hud));

        this.world.addSystem(new AudioGunshotSystem(this.world));
        this.world.addSystem(new AudioFootstepSystem(this.world));

        // Entities
        const player = EntityFactory.Player();
        player.getComponent(Comp.Position2D).set(3, 3);
        this.world.addEntity(player);

        // const wall1 = EntityFactory.Wall();
        // wall1.getComponent(Comp.Position2D).set(11, 3);
        // this.world.addEntity(wall1);

        // const wall2 = EntityFactory.Wall();
        // wall2.getComponent(Comp.Position2D).set(3, 4);
        // this.world.addEntity(wall2);

        // const barrel1 = EntityFactory.Barrel();
        // barrel1.getComponent(Comp.Position2D).set(11, 5);
        // this.world.addEntity(barrel1);

        // const barrel2 = EntityFactory.Barrel();
        // barrel2.getComponent(Comp.Position2D).set(11.25, 5.5);
        // this.world.addEntity(barrel2);
    }

    public update(dt: number) {
        this.world.elapsedTime += dt;
        this.world.update(dt);
        this.input.clear();
    }
}
