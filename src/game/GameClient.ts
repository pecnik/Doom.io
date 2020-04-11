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
import { AudioListener, AudioLoader } from "three";
import { HudDisplaySystem } from "./systems/HudDisplaySystem";
import { WeaponSpecs } from "./data/Weapon";
import { Game } from "./core/Engine";
import { loadTexture } from "./utils/Helpers";

export class GameClient implements Game {
    // private readonly socket: SocketIOClient.Socket;
    private readonly input = new Input({ requestPointerLock: true });
    public readonly world = new World();
    public readonly hud = new Hud();

    public constructor() {
        // const url = location.origin.replace(location.port, "8080");
        // this.socket = SocketIOClient.connect(url, {
        //     reconnection: false,
        //     autoConnect: false
        // });
    }

    public preload() {
        return Promise.all([
            this.world.decals.load(),

            // Load level
            loadTexture("/assets/tileset.png").then(map => {
                this.world.level.setMaterial(map);

                const json = localStorage.getItem("level");
                if (json !== null) {
                    this.world.level.data = JSON.parse(json);
                    this.world.level.updateGeometry();
                }
            }),

            // Preload weapon sprite
            ...WeaponSpecs.map(weapon => {
                return loadTexture(weapon.povSpriteSrc).then(map => {
                    weapon.povSpriteTexture = map;
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

    public create() {
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
        const { max_x, max_y, max_z } = this.world.level.data;

        const player = EntityFactory.Player();
        player.getComponent(Comp.Position).set(max_x / 2, max_y, max_z / 2);
        this.world.addEntity(player);

        const barrel = EntityFactory.Barrel();
        barrel.getComponent(Comp.Position).set(max_x / 2, max_y, max_z / 2);
        this.world.addEntity(barrel);
    }

    public update(dt: number) {
        this.world.elapsedTime += dt;
        this.world.update(dt);
        this.input.clear();
    }
}
