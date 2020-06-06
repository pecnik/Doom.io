import Stats from "stats.js";
import { Hud } from "./data/Hud";
import { Input } from "./core/Input";
import { World, Entity } from "./ecs";
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
import { WEAPON_SPEC_RECORD, WeaponType } from "./data/Weapon";
import { uniq, uniqueId, random } from "lodash";
import { CrosshairSystem } from "./systems/hud/CrosshairSystem";
import { PlayerDashSystem } from "./systems/PlayerDashSystem";
import { AvatarMeshSystem } from "./systems/rendering/AvatarMeshSystem";
import { EntityMeshSystem } from "./systems/rendering/EntityMeshSystem";
import { PickupMeshSystem } from "./systems/rendering/PickupMeshSystem";
import { Scene, Vector3 } from "three";
import { AmmoCountSystem } from "./systems/hud/AmmoCountSystem";
import { DashChargeSystem } from "./systems/hud/DashChargeSystem";
import { Settings } from "./Settings";
import { PlayerBounceSystem } from "./systems/PlayerBounceSystem";
import { HealthBarSystem } from "./systems/hud/HealthBarSystem";
import { LevelJSON } from "../editor/Level";
import { PlayerSyncSystem } from "./systems/PlayerSyncSystem";
import {
    Action,
    ActionType,
    runAction,
    PlaySoundAction,
    SpawnDecalAction,
    AvatarHitAction,
    EmitProjectileAction,
} from "./Action";
import { Sound2D } from "./sound/Sound2D";
import { HitIndicatorSystem } from "./systems/hud/HitIndicatorSystem";
import { getHeadPosition, getHeadingVector3, getWeaponSpec } from "./Helpers";
import { ProjectileDisposalSystem } from "./systems/ProjectileDisposalSystem";
import { PLAYER_RADIUS } from "./data/Globals";

export class GameClient implements Game {
    private readonly stats = GameClient.createStats();

    private readonly route = location.hash.replace("#", "");
    private readonly isMultiplayer = this.route === "/game/multiplayer";

    public readonly hud = new Hud();
    public readonly world = new World();
    public readonly input = new Input({ requestPointerLock: true });

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
        this.world.addSystem(new PlayerInputSystem(this.world, this.input));
        this.world.addSystem(new PlayerMoveSystem(this.world));
        this.world.addSystem(new PlayerDashSystem(this));
        this.world.addSystem(new PlayerBounceSystem(this));
        this.world.addSystem(new PhysicsSystem(this.world));
        this.world.addSystem(new PickupSystem(this.world));
        this.world.addSystem(new AvatarStateSystem(this.world));
        this.world.addSystem(new PlayerCameraSystem(this.world));
        this.world.addSystem(new PlayerShootSystem(this));
        this.world.addSystem(new ProjectileDisposalSystem(this.world));

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
            this.world.addSystem(new HitIndicatorSystem(this, layers[1]));
        }

        // Audio
        this.world.addSystem(new ShooterAudioSystem(this));
        this.world.addSystem(new FootstepAudioSystem(this.world));

        if (this.isMultiplayer) {
            this.connect();
            this.world.addSystem(new PlayerSyncSystem(this));
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

    // Actions

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
                this.run(action);
            }
        };

        this.send = (action: Action) => {
            socket.send(Action.serialize(action));
        };

        socket.onclose = () => {
            this.send = () => {};
        };
    }

    public sendAndRun(action: Action) {
        this.run(action);
        this.send(action);
    }

    public send(_action: Action) {
        // overwrite in connect method
    }

    public run(action: Action) {
        switch (action.type) {
            case ActionType.SpawnDecal: {
                this.world.decals.spawn(action.point, action.normal);
                return;
            }

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

            default: {
                runAction(this.world, action);
                return;
            }
        }
    }

    // Utils

    public playSound(entityId: string, sound: string) {
        const playSound: PlaySoundAction = {
            type: ActionType.PlaySound,
            entityId,
            sound,
        };
        this.sendAndRun(playSound);
    }

    public spawnDecal(point: Vector3, normal: Vector3) {
        const spawnDecal: SpawnDecalAction = {
            type: ActionType.SpawnDecal,
            point,
            normal,
        };
        this.sendAndRun(spawnDecal);
    }

    public hitAvatar(
        shooterId: string,
        targetId: string,
        headshot: boolean,
        weaponType: WeaponType
    ) {
        const hitAvatar: AvatarHitAction = {
            type: ActionType.AvatarHit,
            shooterId,
            targetId,
            weaponType,
            headshot,
        };
        this.sendAndRun(hitAvatar);
    }

    public emitProjectile(avatar: Entity<LocalAvatarArchetype>) {
        const weaponSpec = getWeaponSpec(avatar);
        const spread = weaponSpec.spread;
        const rotation = new Vector3(avatar.rotation.x, avatar.rotation.y, 0);
        rotation.x += random(-spread, spread, true);
        rotation.y += random(-spread, spread, true);

        const velcotiy = getHeadingVector3(rotation);

        const position = getHeadPosition(avatar);
        position.y -= 0.125; // Dunno
        position.x += velcotiy.x * PLAYER_RADIUS * 2;
        position.y += velcotiy.y * PLAYER_RADIUS * 2;
        position.z += velcotiy.z * PLAYER_RADIUS * 2;

        const action: EmitProjectileAction = {
            type: ActionType.EmitProjectile,
            projectileId: uniqueId(`${avatar.playerId}-pe`),
            playerId: avatar.playerId,
            position,
            velcotiy,
        };
        this.sendAndRun(action);
    }
}
