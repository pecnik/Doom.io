import { System, Entity, AnyComponents } from "../ecs";
import { Components } from "../ecs";
import {
    Hitscan,
    isScopeActive,
    getHeadPosition,
    getWeaponSpec,
} from "../Helpers";
import { Color } from "three";
import { random } from "lodash";
import { SWAP_SPEED } from "../data/Globals";
import { WeaponState, WeaponAmmo } from "../data/Types";
import { LocalAvatarArchetype } from "../ecs/Archetypes";
import { Netcode } from "../Netcode";
import { WEAPON_SPEC_RECORD, WeaponSpec } from "../data/Weapon";

class TargetArchetype implements AnyComponents {
    public entityMesh = new Components.EntityMesh();
}

export class PlayerShootSystem extends System {
    private readonly targets = this.createEntityFamily({
        archetype: new TargetArchetype(),
    });

    private readonly players = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    private transition(
        state: WeaponState,
        entity: Entity<LocalAvatarArchetype>
    ) {
        const { input, shooter } = entity;

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
            this.fireBullets(entity);

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

    public update() {
        this.players.entities.forEach((entity) => {
            const input = entity.input;
            const shooter = entity.shooter;
            const weapon = WEAPON_SPEC_RECORD[shooter.weaponType];
            const ammo = shooter.ammo[shooter.weaponType];

            const swap = input.weaponType !== shooter.weaponType;
            const reload = this.getReload(ammo, weapon, input);

            if (shooter.state === WeaponState.Idle) {
                if (swap) {
                    return this.transition(WeaponState.Swap, entity);
                }

                if (reload) {
                    return this.transition(WeaponState.Reload, entity);
                }

                if (input.shoot && ammo.loaded > 0) {
                    return this.transition(WeaponState.Shoot, entity);
                }
            }

            if (shooter.state === WeaponState.Swap) {
                const swapDelta = this.world.elapsedTime - shooter.swapTime;
                if (swapDelta > SWAP_SPEED) {
                    return this.transition(WeaponState.Idle, entity);
                }

                if (reload) {
                    return this.transition(WeaponState.Reload, entity);
                }

                if (swap) {
                    return this.transition(WeaponState.Swap, entity);
                }
            }

            if (shooter.state === WeaponState.Shoot) {
                return this.transition(WeaponState.Cooldown, entity);
            }

            if (shooter.state === WeaponState.Cooldown) {
                const fireRate = weapon.firerate;
                const shootDelta = this.world.elapsedTime - shooter.shootTime;
                if (shootDelta > fireRate) {
                    return this.transition(WeaponState.Idle, entity);
                }
            }

            if (shooter.state === WeaponState.Reload) {
                if (swap) {
                    return this.transition(WeaponState.Swap, entity);
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

                    return this.transition(WeaponState.Idle, entity);
                }
            }
        });
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

    private fireBullets(player: Entity<LocalAvatarArchetype>) {
        const position = getHeadPosition(player);
        const rotation = player.rotation;
        const weaponSpec = getWeaponSpec(player);

        // Init hitscan
        Hitscan.caster.entity = player;
        Hitscan.camera.position.copy(position);
        Hitscan.camera.rotation.set(rotation.x, rotation.y, 0, "YXZ");
        Hitscan.camera.updateWorldMatrix(false, false);

        // Get spread
        const steady = isScopeActive(player) ? 0.25 : 1;
        const spread = weaponSpec.spread * steady;

        // Fire off all bullets
        for (let j = 0; j < weaponSpec.bulletsPerShot; j++) {
            Hitscan.origin.set(
                random(-spread, spread, true),
                random(-spread, spread, true)
            );

            Hitscan.raycaster.setFromCamera(Hitscan.origin, Hitscan.camera);

            const rsp = Hitscan.cast(this.world, this.targets);
            if (rsp.intersection === undefined) {
                continue;
            }

            if (!rsp.intersection.face) {
                continue;
            }

            const { point, face } = rsp.intersection;

            // Bullet decal
            if (rsp.entity === undefined) {
                this.world.decals.spawn(point, face.normal);
                this.world.particles.emit(
                    point,
                    face.normal,
                    new Color(0, 0, 0)
                );
            }

            // Apply damage
            const target = rsp.entity;
            if (target !== undefined && target.health !== undefined) {
                // TODO - if multiple bullets, bundle up into one
                const hitEvent = new Netcode.HitEntity();
                hitEvent.attackerId = player.id;
                hitEvent.targetId = target.id;
                hitEvent.weaponType = player.shooter.weaponType;
                hitEvent.damage = weaponSpec.bulletDamage;
                player.eventsBuffer.push(hitEvent);

                this.world.particles.emitBlood(point, face.normal);
            }
        }
    }
}
