import { System, Entity } from "../ecs";
import { Components } from "../ecs";
import {
    Hitscan,
    isScopeActive,
    getHeadPosition,
    getWeaponSpec,
    getEntityMesh,
} from "../Helpers";
import { Intersection, Vector3 } from "three";
import { random } from "lodash";
import { SWAP_SPEED } from "../data/Globals";
import { WeaponState, WeaponAmmo } from "../data/Types";
import { LocalAvatarArchetype, EnemyAvatarArchetype } from "../ecs/Archetypes";
import { WEAPON_SPEC_RECORD, WeaponSpec, WeaponType } from "../data/Weapon";
import { GameClient } from "../GameClient";
import { Action } from "../Action";

class HitscanResponse {
    public intersection: Intersection;
    public normal: Vector3;
    public point: Vector3;
    public enemyEntity?: Entity<EnemyAvatarArchetype>;
    public enemyHit?: "head" | "body";

    public constructor(intersection: Intersection) {
        const { point, face } = intersection;
        this.intersection = intersection;
        this.point = point;
        this.normal = face ? face.normal : new Vector3(0, 0, 1);
    }
}
export class PlayerShootSystem extends System<GameClient> {
    private readonly players = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    private readonly targets = this.createEntityFamily({
        archetype: new EnemyAvatarArchetype(),
    });

    public update() {
        const avatar = this.players.first();
        if (avatar === undefined) return;

        const input = avatar.input;
        const shooter = avatar.shooter;
        const weapon = WEAPON_SPEC_RECORD[shooter.weaponType];
        const ammo = shooter.ammo[shooter.weaponType];

        const swap = input.weaponType !== shooter.weaponType;
        const reload = this.getReload(ammo, weapon, input);

        if (shooter.state === WeaponState.Idle) {
            if (swap) {
                return this.transition(WeaponState.Swap, avatar);
            }

            if (reload) {
                return this.transition(WeaponState.Reload, avatar);
            }

            if (input.shoot && ammo.loaded > 0) {
                return this.transition(WeaponState.Shoot, avatar);
            }
        }

        if (shooter.state === WeaponState.Swap) {
            const swapDelta = this.world.elapsedTime - shooter.swapTime;
            if (swapDelta > SWAP_SPEED) {
                return this.transition(WeaponState.Idle, avatar);
            }

            if (reload) {
                return this.transition(WeaponState.Reload, avatar);
            }

            if (swap) {
                return this.transition(WeaponState.Swap, avatar);
            }
        }

        if (shooter.state === WeaponState.Shoot) {
            return this.transition(WeaponState.Cooldown, avatar);
        }

        if (shooter.state === WeaponState.Cooldown) {
            const fireRate = weapon.firerate;
            const shootDelta = this.world.elapsedTime - shooter.shootTime;
            if (shootDelta > fireRate) {
                return this.transition(WeaponState.Idle, avatar);
            }
        }

        if (shooter.state === WeaponState.Reload) {
            if (swap) {
                return this.transition(WeaponState.Swap, avatar);
            }

            const weapon = WEAPON_SPEC_RECORD[shooter.weaponType];
            const reloadDelta = this.world.elapsedTime - shooter.reloadTime;
            if (reloadDelta > weapon.reloadSpeed) {
                const reload = Math.min(
                    weapon.maxLoadedAmmo - ammo.loaded,
                    ammo.reserved
                );

                ammo.loaded += reload;
                ammo.reserved -= reload;

                input.reloadQueue = false;

                return this.transition(WeaponState.Idle, avatar);
            }
        }
    }

    private transition(
        state: WeaponState,
        avatar: Entity<LocalAvatarArchetype>
    ) {
        const { input, shooter } = avatar;

        if (state === WeaponState.Idle) {
            shooter.state = WeaponState.Idle;
            return;
        }

        if (state === WeaponState.Shoot) {
            shooter.state = WeaponState.Shoot;
            shooter.sound = WeaponState.Shoot;
            shooter.shootTime = this.world.elapsedTime;

            const ammo = shooter.ammo[shooter.weaponType];
            ammo.loaded--;
            shooter.shootTime = this.world.elapsedTime;
            this.shootBullet(avatar);

            return;
        }

        if (state === WeaponState.Swap) {
            shooter.state = WeaponState.Swap;
            shooter.swapTime = this.world.elapsedTime;
            shooter.weaponType = input.weaponType;
            input.reloadQueue = false;
            return;
        }

        if (state === WeaponState.Cooldown) {
            shooter.state = WeaponState.Cooldown;
            return;
        }

        if (state === WeaponState.Reload) {
            shooter.state = WeaponState.Reload;
            shooter.sound = WeaponState.Reload;
            shooter.reloadTime = this.world.elapsedTime;
            input.reloadQueue = false;
            return;
        }

        console.warn(`> No state transition for ${state}`);
    }

    private getReload(
        ammo: WeaponAmmo,
        weapon: WeaponSpec,
        input: Components.Input
    ) {
        if (ammo.loaded >= weapon.maxLoadedAmmo) return false;
        if (ammo.reserved < 1) return false;
        return input.reloadQueue || ammo.loaded < 1;
    }

    private shootBullet(player: Entity<LocalAvatarArchetype>) {
        const position = getHeadPosition(player);
        const rotation = player.rotation;
        const weaponSpec = getWeaponSpec(player);

        if (weaponSpec.type === WeaponType.Plasma) {
            this.game.dispatch(Action.emitProjectile(player));
            return;
        }

        // Init hitscan camera
        Hitscan.caster.entity = player;
        Hitscan.camera.position.copy(position);
        Hitscan.camera.rotation.set(rotation.x, rotation.y, 0, "YXZ");
        Hitscan.camera.updateWorldMatrix(false, false);

        for (let j = 0; j < weaponSpec.bulletsPerShot; j++) {
            const rsp = this.hitscan(player);
            if (rsp === undefined) continue;

            // Only the level was hit, spawn bullet decal
            if (rsp.enemyEntity === undefined) {
                this.game.dispatch(Action.spawnDecal(rsp.point, rsp.normal));
                continue;
            }

            // this.emitBloodParticles(rsp);
            this.game.dispatch(
                Action.hitAvatar(
                    player.id,
                    rsp.enemyEntity.id,
                    rsp.enemyHit === "head",
                    player.shooter.weaponType
                )
            );
        }
    }

    // private emitBloodParticles(rsp: HitscanResponse) {
    //     const matrix = new Matrix3();
    //     matrix.getNormalMatrix(rsp.intersection.object.matrixWorld);
    //     const worldNormal = rsp.normal
    //         .clone()
    //         .applyMatrix3(matrix)
    //         .normalize();
    //     this.world.particles.blood(rsp.point, worldNormal);
    // }

    private hitscan(player: Entity<LocalAvatarArchetype>) {
        const weaponSpec = getWeaponSpec(player);

        // Init Hitscan raycaster
        const steady = isScopeActive(player) ? 0.25 : 1;
        const spread = weaponSpec.spread * steady;
        Hitscan.origin.x = random(-spread, spread, true);
        Hitscan.origin.y = random(-spread, spread, true);
        Hitscan.raycaster.setFromCamera(Hitscan.origin, Hitscan.camera);

        const buffer: Intersection[] = [];
        Hitscan.raycaster.intersectObject(this.world.level.mesh, false, buffer);

        let response: HitscanResponse | undefined = undefined;
        if (buffer[0] !== undefined) {
            response = new HitscanResponse(buffer[0]);
        }

        this.targets.entities.forEach((enemy) => {
            const prev = buffer[0];

            const mesh = getEntityMesh(this.world, enemy);
            if (mesh === undefined) return;

            const base = mesh.getObjectByName("BASE");
            if (base === undefined) return;

            const body = base.getObjectByName("BODY");
            if (body === undefined) return;

            const head = body.getObjectByName("HEAD");
            if (head === undefined) return;

            const test = [base, body, head];
            Hitscan.raycaster.intersectObjects(test, false, buffer);

            if (buffer[0] !== prev) {
                response = new HitscanResponse(buffer[0]);
                response.enemyEntity = enemy;
                response.enemyHit = buffer[0].object === head ? "head" : "body";
            }
        });

        return response;
    }
}
