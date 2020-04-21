import { System, Entity, AnyComponents } from "../ecs";
import { World } from "../ecs";
import { Comp } from "../ecs";
import { Hitscan, isScopeActive, getHeadPosition } from "../utils/Helpers";
import { Color } from "three";
import { random } from "lodash";
import { modulo } from "../core/Utils";
import { SWAP_SPEED } from "../data/Globals";
import {
    WeaponSpecs,
    WeaponState,
    WeaponAmmo,
    WeaponSpec,
} from "../data/Weapon";

class TargetArchetype implements AnyComponents {
    public render = new Comp.Render();
}

class ShooterArchetype implements AnyComponents {
    public input = new Comp.PlayerInput();
    public position = new Comp.Position();
    public rotation = new Comp.Rotation2D();
    public shooter = new Comp.Shooter();
    public collision = new Comp.Collision();
}

export class PlayerShootSystem extends System {
    private readonly targets = this.createEntityFamily({
        archetype: new TargetArchetype(),
    });

    private readonly shooters = this.createEntityFamily({
        archetype: new ShooterArchetype(),
    });

    private transition(
        state: WeaponState,
        entity: Entity<ShooterArchetype>,
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
        this.shooters.entities.forEach((entity) => {
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
        input: Comp.PlayerInput
    ) {
        if (ammo.loaded >= weapon.maxLoadedAmmo) return false;
        if (ammo.reserved < 1) return false;
        return input.reload || ammo.loaded < 1;
    }

    private fireBullets(world: World, entity: Entity<ShooterArchetype>) {
        const position = getHeadPosition(entity);
        const rotation = entity.rotation;
        const shooter = entity.shooter;
        const weapon = WeaponSpecs[shooter.weaponIndex];

        // Init hitscan
        Hitscan.caster.entity = entity;
        Hitscan.camera.position.copy(position);
        Hitscan.camera.rotation.set(rotation.x, rotation.y, 0, "YXZ");
        Hitscan.camera.updateWorldMatrix(false, false);

        // Get spread
        const steady = isScopeActive(entity) ? 0.25 : 1;
        const spread = weapon.spread * steady;

        // Fire off all bullets
        for (let j = 0; j < weapon.bulletsPerShot; j++) {
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
            if (
                rsp.entity === undefined ||
                rsp.entity.renderdecaltag !== undefined
            ) {
                world.decals.spawn(point, face.normal);
            }

            // Apply damage
            const target = rsp.entity;
            if (target !== undefined && target.health !== undefined) {
                const health = target.health;
                health.value -= 25;

                if (health.value <= 0) {
                    world.removeEntity(target.id);
                }
            }
        }
    }
}
