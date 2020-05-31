import Stats from "stats.js";
import { Hud } from "./data/Hud";
import { Input } from "./core/Input";
import { World } from "./ecs";
import { PlayerInputSystem } from "./systems/PlayerInputSystem";
import { PlayerCameraSystem } from "./systems/PlayerCameraSystem";
import { PlayerMoveSystem } from "./systems/PlayerMoveSystem";
import { PhysicsSystem } from "./systems/PhysicsSystem";
import { PlayerShootSystem } from "./systems/PlayerShootSystem";
import { WeaponSpriteSystem } from "./systems/rendering/WeaponSpriteSystem";
import { Game } from "./core/Engine";
import { InfineteRespawnSystem } from "./systems/InfineteRespawnSystem";
import { PickupSystem } from "./systems/PickupSystem";
import { LocalAvatarArchetype } from "./ecs/Archetypes";
import { AvatarStateSystem } from "./systems/AvatarStateSystem";
import { ShooterAudioSystem } from "./systems/audio/ShooterAudioSystem";
import { Sound3D } from "./sound/Sound3D";
import { FootstepAudioSystem } from "./systems/audio/FootstepAudioSystem";
import { createSkybox } from "./data/Skybox";
import { WEAPON_SPEC_RECORD } from "./data/Weapon";
import { uniq } from "lodash";
import { CrosshairSystem } from "./systems/hud/CrosshairSystem";
import { PlayerDashSystem } from "./systems/PlayerDashSystem";
import { AvatarMeshSystem } from "./systems/rendering/AvatarMeshSystem";
import { EntityMeshSystem } from "./systems/rendering/EntityMeshSystem";
import { PickupMeshSystem } from "./systems/rendering/PickupMeshSystem";
import { Scene } from "three";
import { AmmoCountSystem } from "./systems/hud/AmmoCountSystem";
import { DashChargeSystem } from "./systems/hud/DashChargeSystem";
import { Settings } from "./Settings";
import { PlayerBounceSystem } from "./systems/PlayerBounceSystem";
import { HealthBarSystem } from "./systems/hud/HealthBarSystem";
import { LevelJSON } from "../editor/Level";
import {
    ClientDispatcher,
} from "./events/ClientDispatcher";
import { ClientDispatcherMultiplayer } from "./events/ClientDispatcherMultiplayer";

export class GameClient implements Game {
    private readonly stats = GameClient.createStats();
    private readonly input = new Input({ requestPointerLock: true });

    private readonly route = location.hash.replace("#", "");
    private readonly isMultiplayer = this.route === "/game/multiplayer";

    public readonly hud = new Hud();
    public readonly world = new World();
    public dispatcher = new ClientDispatcher(this.world);

    private static createStats() {
        if (Settings.props.fpsMeter) {
            const stats = new Stats();
            document.body.appendChild(stats.dom);
            return stats;
        }

        return {
            begin() {},
            end() {},
        };
    }

    public preload() {
        let weaponSounds: string[] = [];
        Object.values(WEAPON_SPEC_RECORD).forEach((spec) => {
            weaponSounds.push(spec.fireSound);
            weaponSounds.push(spec.reloadSound);
        });
        weaponSounds = uniq(weaponSounds);

        return Promise.all([
            this.world.decals.load(),
            this.world.particles.load(),

            // Preload weapon audio
            Sound3D.load([
                ...weaponSounds,
                "/assets/sounds/footstep.wav",
                "/assets/sounds/whoosh.wav",
                "/assets/sounds/bounce.wav",
            ]),

            // Load level
            this.world.level.loadMaterial().then(() => {
                const loadLevelJson = (): Promise<LevelJSON> => {
                    const route = location.hash.replace("#", "");
                    const json = localStorage.getItem("level");
                    if (json !== null && route === "/game/singleplayer") {
                        return Promise.resolve(JSON.parse(json));
                    }

                    const url = "/assets/levels/test_arena.json";
                    return fetch(url).then((rsp) => rsp.json());
                };

                return loadLevelJson().then((json) => {
                    this.world.level.readJson(json);
                    this.world.level.updateGeometry();
                    this.world.level.updateGeometryLightning();
                    this.world.level.updateAmbientOcclusion();
                });
            }),

            // Create skyboc
            createSkybox().then((skybox) => {
                this.world.scene.add(skybox);
            }),
        ]);
    }

    public create() {
        // Init camera position
        const { width, height, depth } = this.world.level;
        this.world.camera.position
            .set(width, height, depth)
            .multiplyScalar(0.5);
        this.world.camera.near = 0.01;
        this.world.camera.far = 512;
        this.world.camera.updateProjectionMatrix();

        // Init Sound3D
        this.world.camera.add(Sound3D.listener);
        this.world.scene.add(Sound3D.group);

        // Systems
        this.world.addSystem(new PlayerInputSystem(this.world, this.input));
        this.world.addSystem(new PlayerMoveSystem(this.world));
        this.world.addSystem(new PlayerDashSystem(this));
        this.world.addSystem(new PlayerBounceSystem(this));
        this.world.addSystem(new PhysicsSystem(this.world));
        this.world.addSystem(new PickupSystem(this.world));
        this.world.addSystem(new AvatarStateSystem(this.world));
        this.world.addSystem(new PlayerCameraSystem(this.world));
        this.world.addSystem(new PlayerShootSystem(this.world));

        // World rendering
        this.world.addSystem(new EntityMeshSystem(this.world));
        this.world.addSystem(new AvatarMeshSystem(this.world));
        this.world.addSystem(new PickupMeshSystem(this.world));

        {
            // Hud rendering
            const layers = [new Scene(), new Scene()];
            this.hud.layers.push(...layers);
            this.world.addSystem(new WeaponSpriteSystem(this.world, layers[0]));
            this.world.addSystem(new CrosshairSystem(this.world, layers[1]));
            this.world.addSystem(new AmmoCountSystem(this.world, layers[1]));
            this.world.addSystem(new DashChargeSystem(this.world, layers[1]));
            this.world.addSystem(new HealthBarSystem(this.world, layers[1]));
        }

        // Audio
        this.world.addSystem(new ShooterAudioSystem(this));
        this.world.addSystem(new FootstepAudioSystem(this.world));

        if (this.isMultiplayer) {
            this.dispatcher = new ClientDispatcherMultiplayer(this.world);
        } else {
            const avatar = { id: "p1", ...new LocalAvatarArchetype() };
            this.world.addSystem(new InfineteRespawnSystem(this.world));
            this.world.addEntity(avatar);
        }
    }

    public update(dt: number) {
        this.stats.begin();
        this.world.update(dt);
        this.input.clear();
        this.stats.end();
    }
}
