import { Hud } from "./data/Hud";
import { Input } from "./core/Input";
import { World } from "./ecs";
import { PlayerInputSystem } from "./systems/PlayerInputSystem";
import { PlayerCameraSystem } from "./systems/PlayerCameraSystem";
import { EntityFactory } from "./data/EntityFactory";
import { PlayerMoveSystem } from "./systems/PlayerMoveSystem";
import { PhysicsSystem } from "./systems/PhysicsSystem";
import { RenderSystem } from "./systems/RenderSystem";
import { AudioFootstepSystem } from "./systems/AudioFootstepSystem";
import { PlayerShootSystem } from "./systems/PlayerShootSystem";
import { AudioGunshotSystem } from "./systems/AudioGunshotSystem";
import { HudWeaponSystem } from "./systems/HudWeaponSystem";
import { AudioListener, AudioLoader } from "three";
import { HudDisplaySystem } from "./systems/HudDisplaySystem";
import { WeaponSpecs } from "./data/Weapon";
import { Game } from "./core/Engine";
import { loadTexture, setPosition } from "./Helpers";
import { PlayerCouchSystem } from "./systems/PlayerCouchSystem";
import { GenericSystem } from "./systems/GenericSystem";
import { sample } from "lodash";
import Stats from "stats.js";

export class GameClient implements Game {
    // private readonly socket: SocketIOClient.Socket;
    private readonly stats = new Stats();
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
            loadTexture("/assets/tileset.png").then((map) => {
                this.world.level.setMaterial(map);

                const loadLevelData = () => {
                    const json = localStorage.getItem("level");
                    if (json !== null) return Promise.resolve(JSON.parse(json));

                    const url = "/assets/levels/castle.json";
                    return fetch(url).then((rsp) => rsp.json());
                };

                return loadLevelData().then((data) => {
                    this.world.level.data = data;
                    this.world.level.updateSpawnPoints();
                    this.world.level.updateGeometry();
                    this.world.level.updateLighing();

                    // this.world.scene.add(this.world.level.debug);
                });
            }),

            // Preload weapon sprite
            ...WeaponSpecs.map((weapon) => {
                return loadTexture(weapon.povSpriteSrc).then((map) => {
                    weapon.povSpriteTexture = map;
                });
            }),

            // Preload weapon audio
            ...WeaponSpecs.map((weapon) => {
                return new Promise((resolve) => {
                    new AudioLoader().load(weapon.fireSoundSrc, (buffer) => {
                        weapon.fireSoundBuffer = buffer;
                        resolve();
                    });
                });
            }),
        ]);
    }

    public create() {
        // Mount stats
        document.body.appendChild(this.stats.dom);

        // Init audio listener
        this.world.listener = new AudioListener();
        this.world.camera.add(this.world.listener);

        // Systems
        this.world.addSystem(new PlayerInputSystem(this.world, this.input));
        this.world.addSystem(new PlayerMoveSystem(this.world));
        this.world.addSystem(new PlayerCouchSystem(this.world));
        this.world.addSystem(new PhysicsSystem(this.world));
        this.world.addSystem(new GenericSystem(this.world));
        this.world.addSystem(new PlayerCameraSystem(this.world));
        this.world.addSystem(new PlayerShootSystem(this.world));
        this.world.addSystem(new RenderSystem(this.world));

        this.world.addSystem(new HudDisplaySystem(this.world, this.hud));
        this.world.addSystem(new HudWeaponSystem(this.world, this.hud));

        this.world.addSystem(new AudioGunshotSystem(this.world));
        this.world.addSystem(new AudioFootstepSystem(this.world));

        // Entities
        const entities = [
            EntityFactory.Player(),
            EntityFactory.Barrel(),
            EntityFactory.Barrel(),
            EntityFactory.Barrel(),
            EntityFactory.Barrel(),
        ];
        entities.forEach((entity) => {
            const spawn = sample(this.world.level.spawnPoints);
            if (spawn !== undefined) {
                setPosition(entity, spawn);
                this.world.addEntity(entity);
            }
        });
    }

    public update(dt: number) {
        this.stats.begin();
        this.world.elapsedTime += dt;
        this.world.update(dt);
        this.input.clear();
        this.stats.end();
    }
}
