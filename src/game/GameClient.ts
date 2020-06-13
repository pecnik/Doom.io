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
import { LocalAvatarArchetype } from "./ecs/Archetypes";
import { AvatarStateSystem } from "./systems/AvatarStateSystem";
import { ShooterAudioSystem } from "./systems/audio/ShooterAudioSystem";
import { Sound3D } from "./sound/Sound3D";
import { FootstepAudioSystem } from "./systems/audio/FootstepAudioSystem";
import { createSkybox } from "./data/Skybox";
import { WEAPON_SPEC_RECORD } from "./data/Weapon";
import { uniq, debounce, sample } from "lodash";
import { CrosshairSystem } from "./systems/hud/CrosshairSystem";
import { PlayerDashSystem } from "./systems/PlayerDashSystem";
import { AvatarMeshSystem } from "./systems/rendering/AvatarMeshSystem";
import { EntityMeshSystem } from "./systems/rendering/EntityMeshSystem";
import { PickupMeshSystem } from "./systems/rendering/PickupMeshSystem";
import { Scene } from "three";
import { AmmoCountSystem } from "./systems/hud/AmmoCountSystem";
import { DashChargeSystem } from "./systems/hud/DashChargeSystem";
import { Settings } from "../settings/Settings";
import { PlayerBounceSystem } from "./systems/PlayerBounceSystem";
import { HealthBarSystem } from "./systems/hud/HealthBarSystem";
import { LevelJSON } from "../editor/Level";
import { PlayerSyncSystem } from "./systems/PlayerSyncSystem";
import { Action, ActionType } from "./Action";
import { Sound2D } from "./sound/Sound2D";
import { HitIndicatorSystem } from "./systems/hud/HitIndicatorSystem";
import { ProjectileDisposalSystem } from "./systems/ProjectileDisposalSystem";
import { PickupSpawnSystem } from "./systems/PickupSpawnSystem";
import { GameContext } from "./GameContext";
import { PickupConsumeSystem } from "./systems/PickupConsumeSystem";
import { getHeadPosition } from "./Helpers";
import { LeaderboardSystem } from "./systems/hud/LeaderboardSystem";
import { ProjectileMeshSystem } from "./systems/rendering/ProjectileMeshSystem";
import { ExplosionSystem } from "./systems/rendering/ExplosionSystem";

export class GameClient extends GameContext implements Game {
    private readonly route = location.hash.replace("#", "");
    private readonly isMultiplayer = this.route === "/game/multiplayer";

    public readonly hud = new Hud();
    public readonly world = new World();
    public readonly input = new Input({
        requestPointerLock: true,
        element: document.getElementById("viewport") as HTMLCanvasElement,
    });

    private connect() {
        const url = location.origin
            .replace(location.port, "8080")
            .replace("http://", "ws://")
            .replace("https://", "ws://");

        const socket = new WebSocket(url);

        socket.onmessage = (ev) => {
            const msg = ev.data as string;
            const action = Action.deserialize(msg);
            if (action !== undefined) {
                this.runDispatch(action);
            }
        };

        this.syncDispatch = (action: Action) => {
            socket.send(Action.serialize(action));
        };

        socket.onopen = () => {
            const playerName = Settings.profile.displayName;
            const register = Action.registerPlayer(playerName || "");
            socket.send(Action.serialize(register));
        };

        socket.onclose = () => {
            this.syncDispatch = () => {};
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
            Promise.resolve().then(() => {
                const loadLevelJson = (): Promise<LevelJSON> => {
                    const route = location.hash.replace("#", "");
                    const json = localStorage.getItem("level");
                    if (json !== null && route === "/game/singleplayer") {
                        return Promise.resolve(JSON.parse(json));
                    }

                    const url = "/assets/levels/arena.json";
                    return fetch(url).then((rsp) => rsp.json());
                };

                return loadLevelJson()
                    .then((json) => this.world.level.readJson(json))
                    .then(() => this.world.level.loadMaterial())
                    .then(() => this.world.level.updateGeometry())
                    .then(() => this.world.level.updateGeometryLightning())
                    .then(() => this.world.level.updateAmbientOcclusion());
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
        this.world.addSystem(new PlayerInputSystem(this));
        this.world.addSystem(new PlayerMoveSystem(this));
        this.world.addSystem(new PlayerDashSystem(this));
        this.world.addSystem(new PlayerBounceSystem(this));
        this.world.addSystem(new PhysicsSystem(this));
        this.world.addSystem(new AvatarStateSystem(this));
        this.world.addSystem(new PlayerCameraSystem(this));
        this.world.addSystem(new PlayerShootSystem(this));
        this.world.addSystem(new ProjectileDisposalSystem(this));

        // World rendering
        this.world.addSystem(new EntityMeshSystem(this));
        this.world.addSystem(new AvatarMeshSystem(this));
        this.world.addSystem(new PickupMeshSystem(this));
        this.world.addSystem(new ExplosionSystem(this));
        this.world.addSystem(new ProjectileMeshSystem(this));

        {
            // Hud rendering
            const layers = [new Scene(), new Scene()];
            this.hud.layers.push(...layers);
            this.world.addSystem(new WeaponSpriteSystem(this, layers[0]));
            this.world.addSystem(new CrosshairSystem(this, layers[1]));
            this.world.addSystem(new AmmoCountSystem(this, layers[1]));
            this.world.addSystem(new DashChargeSystem(this, layers[1]));
            this.world.addSystem(new HealthBarSystem(this, layers[1]));
            this.world.addSystem(new LeaderboardSystem(this, layers[1]));
            this.world.addSystem(new HitIndicatorSystem(this, layers[1]));
        }

        // Audio
        this.world.addSystem(new ShooterAudioSystem(this));
        this.world.addSystem(new FootstepAudioSystem(this));

        if (this.isMultiplayer) {
            this.connect();
            this.world.addSystem(new PlayerSyncSystem(this));
        } else {
            const avatar = { id: "p1", ...new LocalAvatarArchetype() };
            this.world.addSystem(new InfineteRespawnSystem(this));
            this.world.addSystem(new PickupSpawnSystem(this));
            this.world.addSystem(new PickupConsumeSystem(this));
            this.world.addEntity(avatar);
        }
    }

    public update(dt: number) {
        this.world.update(dt);
        this.input.clear();
    }

    /**
     * Send action over the network.
     *
     * The function is blank when in single player mode.
     * Is overwritten in the connect method.
     */
    public syncDispatch(_action: Action) {}

    /**
     * Execute the dispatched action.
     * Handle some client side specific stuff like sound.
     */
    public runDispatch(action: Action) {
        super.runDispatch(action);
        switch (action.type) {
            case ActionType.PlaySound: {
                const { entityId, sound } = action;
                const entity = this.world.entities.get(entityId);
                if (entity === undefined) return;
                if (entity.position === undefined) return;

                if (entity.localAvatarTag === true) {
                    Sound2D.get(sound).play();
                } else {
                    Sound3D.get(sound).emitFrom(entity);
                }
                return;
            }

            case ActionType.AvatarHit: {
                const target = this.avatars.entities.get(action.targetId);
                const shooter = this.avatars.entities.get(action.shooterId);
                if (target === undefined) return;
                if (shooter === undefined) return;

                const p1 = getHeadPosition(target);
                const p2 = getHeadPosition(shooter);
                const direction = p1
                    .clone()
                    .sub(p2)
                    .normalize()
                    .multiplyScalar(-1);
                this.world.particles.blood(p1, direction);

                if (target.health.value > 0 && target.localAvatarTag === true) {
                    this.painSound(false);
                }

                return;
            }
        }
    }

    public painSound = (() => {
        const death = [
            "/assets/sounds/death_jack_01.wav",
            "/assets/sounds/death_jack_02.wav",
        ];

        const pain = [
            "/assets/sounds/pain_jack_01.wav",
            "/assets/sounds/pain_jack_02.wav",
            "/assets/sounds/pain_jack_03.wav",
        ];

        return debounce((dead = false) => {
            const sound = dead ? sample(death) : sample(pain);
            if (sound !== undefined) {
                Sound2D.get(sound).play();
            }
        }, 1000 / 30);
    })();
}
