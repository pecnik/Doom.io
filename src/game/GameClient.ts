import { Hud } from "./data/Hud";
import { Input } from "./core/Input";
import { World } from "./ecs";
import { PlayerInputSystem } from "./systems/PlayerInputSystem";
import { PlayerCameraSystem } from "./systems/PlayerCameraSystem";
import { PlayerMoveSystem } from "./systems/PlayerMoveSystem";
import { PhysicsSystem } from "./systems/PhysicsSystem";
import { RenderSystem } from "./systems/RenderSystem";
import { PlayerShootSystem } from "./systems/PlayerShootSystem";
import { WeaponSpriteSystem } from "./systems/hud/WeaponSpriteSystem";
import { HudDisplaySystem } from "./systems/hud/HudDisplaySystem";
import { Game } from "./core/Engine";
import { loadTexture, EntityMesh } from "./Helpers";
import { GenericSystem } from "./systems/GenericSystem";
import Stats from "stats.js";
import { PickupSystem } from "./systems/PickupSystem";
import { ClientNetcodeSystem } from "./systems/ClientNetcodeSystem";
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

export class GameClient implements Game {
    private readonly stats = new Stats();
    private readonly input = new Input({ requestPointerLock: true });
    public readonly world = new World();
    public readonly hud = new Hud();

    public preload() {
        let weaponSounds: string[] = [];
        Object.values(WEAPON_SPEC_RECORD).forEach((spec) => {
            weaponSounds.push(spec.fireSound);
            weaponSounds.push(spec.reloadSound);
        });
        weaponSounds = uniq(weaponSounds);

        return Promise.all([
            this.world.decals.load(),

            // Load entity mesh data
            EntityMesh.load(),

            // Preload weapon audio
            Sound3D.load(["/assets/sounds/footstep.wav"]),
            Sound3D.load(weaponSounds),

            // Load level
            loadTexture("/assets/tileset.png").then((map) => {
                this.world.level.setMaterial(map);

                const loadLevelData = () => {
                    const json = localStorage.getItem("level");
                    if (json !== null) return Promise.resolve(JSON.parse(json));

                    const url = "/assets/levels/factory.json";
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

            // Create skyboc
            createSkybox().then((skybox) => {
                this.world.scene.add(skybox);
            }),
        ]);
    }

    public create() {
        // Mount stats
        document.body.appendChild(this.stats.dom);

        // Init camera position
        const { max_x, max_y, max_z } = this.world.level.data;
        this.world.camera.position.set(max_x, max_y, max_z).multiplyScalar(0.5);

        // Init Sound3D
        this.world.camera.add(Sound3D.listener);
        this.world.scene.add(Sound3D.group);

        // Systems
        this.world.addSystem(new PlayerInputSystem(this.world, this.input));
        this.world.addSystem(new PlayerMoveSystem(this.world));
        this.world.addSystem(new PlayerDashSystem(this.world));
        this.world.addSystem(new PhysicsSystem(this.world));
        this.world.addSystem(new PickupSystem(this.world));
        this.world.addSystem(new GenericSystem(this.world));
        this.world.addSystem(new AvatarStateSystem(this.world));
        this.world.addSystem(new PlayerCameraSystem(this.world));
        this.world.addSystem(new PlayerShootSystem(this.world));
        this.world.addSystem(new RenderSystem(this.world));

        // Hud
        this.world.addSystem(new CrosshairSystem(this.world, this.hud));
        this.world.addSystem(new HudDisplaySystem(this.world, this.hud));
        this.world.addSystem(new WeaponSpriteSystem(this.world, this.hud));

        // Audio
        this.world.addSystem(new ShooterAudioSystem(this.world));
        this.world.addSystem(new FootstepAudioSystem(this.world));

        // Temporary ftw idk
        const route = location.hash.replace("#", "");
        if (route === "/game/multiplayer") {
            this.world.addSystem(new ClientNetcodeSystem(this.world));
        } else {
            const avatar = { id: "p1", ...new LocalAvatarArchetype() };
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
