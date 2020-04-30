import { System, Entity, AnyComponents } from "../ecs";
import { World } from "../ecs";
import { Components } from "../ecs";
import {
    Hitscan,
    isScopeActive,
    getHeadPosition,
    getWeaponSpec,
} from "../Helpers";
import { Color } from "three";
import { random } from "lodash";
import { modulo } from "../core/Utils";
import { SWAP_SPEED } from "../data/Globals";
import {
    WeaponSpecs,
    WeaponState,
    WeaponAmmo,
    WeaponSpec,
} from "../weapons/Weapon";
import { LocalAvatarArchetype } from "../ecs/Archetypes";
import { Netcode } from "../Netcode";

class TargetArchetype implements AnyComponents {
    public render = new Components.Render();
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
        entity: Entity<LocalAvatarArchetype>,
        world: World
    ) {
        const { input, shooter } = entity;

        if (state === WeaponState.Idle) {
            shooter.state = WeaponState.Idle;
            return;
        }

        if (state === WeaponState.Shoot) {
            shooter.state = WeaponState.Shoot;
            shooter.shootTime = world.elapsedTime;

            const ammo = shooter.ammo[shooter.weaponIndex];
            ammo.loaded--;
            shooter.shootTime = world.elapsedTime;
            this.fireBullets(world, entity);

            return;
        }

        if (state === WeaponState.Swap) {
            shooter.state = WeaponState.Swap;
            shooter.swapTime = world.elapsedTime;
            shooter.weaponIndex = input.weaponIndex;
            shooter.weaponIndex = modulo(shooter.weaponIndex, 3);
            return;
        }

        if (state === WeaponState.Cooldown) {
            shooter.state = WeaponState.Cooldown;
            return;
        }

        if (state === WeaponState.Reload) {
            shooter.state = WeaponState.Reload;
            shooter.reloadTime = world.elapsedTime;
            return;
        }

        console.warn(`> No state transition for ${state}`);
    }

    public update(world: World) {
        this.players.entities.forEach((entity) => {
            const input = entity.input;
            const shooter = entity.shooter;
            const weapon = WeaponSpecs[shooter.weaponIndex];
            const ammo = shooter.ammo[shooter.weaponIndex];

            const swap = input.weaponIndex !== shooter.weaponIndex;
            const reload = this.getReload(ammo, weapon, input);

            if (shooter.state === WeaponState.Idle) {
                if (swap) {
                    return this.transition(WeaponState.Swap, entity, world);
                }

                if (reload) {
                    return this.transition(WeaponState.Reload, entity, world);
                }

                if (input.shoot && ammo.loaded > 0) {
                    return this.transition(WeaponState.Shoot, entity, world);
                }
            }

            if (shooter.state === WeaponState.Swap) {
                const swapDelta = world.elapsedTime - shooter.swapTime;
                if (swapDelta > SWAP_SPEED) {
                    return this.transition(WeaponState.Idle, entity, world);
                }

                if (reload) {
                    return this.transition(WeaponState.Reload, entity, world);
                }

                if (swap) {
                    return this.transition(WeaponState.Swap, entity, world);
                }
            }

            if (shooter.state === WeaponState.Shoot) {
                if (reload) {
                    return this.transition(WeaponState.Reload, entity, world);
                } else {
                    return this.transition(WeaponState.Cooldown, entity, world);
                }
            }

            if (shooter.state === WeaponState.Cooldown) {
                const fireRate = weapon.firerate;
                const shootDelta = world.elapsedTime - shooter.shootTime;
                if (shootDelta > fireRate) {
                    return this.transition(WeaponState.Idle, entity, world);
                }
            }

            if (shooter.state === WeaponState.Reload) {
                if (swap) {
                    return this.transition(WeaponState.Swap, entity, world);
                }

                const weapon = WeaponSpecs[shooter.weaponIndex];
                const reloadDelta = world.elapsedTime - shooter.reloadTime;
                if (reloadDelta > weapon.reloadSpeed) {
                    const reload = Math.min(
                        weapon.maxLoadedAmmo - ammo.loaded,
                        ammo.reserved
                    );

                    ammo.loaded += reload;
                    ammo.reserved -= reload;
                    return this.transition(WeaponState.Idle, entity, world);
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
        return input.reload || ammo.loaded < 1;
    }

    private fireBullets(world: World, player: Entity<LocalAvatarArchetype>) {
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

            const rsp = Hitscan.cast(world, this.targets);
            if (rsp.intersection === undefined) {
                continue;
            }

            if (!rsp.intersection.face) {
                continue;
            }

            const { point, face } = rsp.intersection;

            // Emit particles
            world.particles.emit(point, face.normal, new Color(0, 0, 0));

            // Bullet decal
            if (rsp.entity === undefined) {
                world.decals.spawn(point, face.normal);
            }

            // Apply damage
            const target = rsp.entity;
            if (target !== undefined && target.health !== undefined) {
                // TODO - if multiple bullets, bundle up into one
                const hitEvent = new Netcode.HitEntity();
                hitEvent.attackerId = player.id;
                hitEvent.targetId = target.id;
                hitEvent.weaponIindex = player.shooter.weaponIndex;
                hitEvent.damage = weaponSpec.bulletDamage;
                player.eventsBuffer.push(hitEvent);
            }
        }
    }
}
