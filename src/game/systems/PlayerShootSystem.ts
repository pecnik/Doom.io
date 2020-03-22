import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { World } from "../data/World";
import { Comp } from "../data/Comp";
import { Hitscan, isScopeActive } from "../utils/EntityUtils";
import { Color } from "three";
import { random } from "lodash";
import { modulo } from "../core/Utils";
import { SWAP_SPEED } from "../data/Globals";
import { WeaponSpecs, WeaponState } from "../data/Weapon";

export class PlayerShootSystem extends System {
    private readonly targets: Family;
    private readonly shooters: Family;

    public constructor(world: World) {
        super();

        this.targets = new FamilyBuilder(world).include(Comp.Render).build();

        this.shooters = new FamilyBuilder(world)
            .include(Comp.PlayerInput)
            .include(Comp.Position2D)
            .include(Comp.Rotation2D)
            .include(Comp.Shooter)
            .build();
    }

    private transition(state: WeaponState, entity: Entity, world: World) {
        const input = entity.getComponent(Comp.PlayerInput);
        const shooter = entity.getComponent(Comp.Shooter);

        if (state === WeaponState.Idle) {
            console.log("> Idle");
            shooter.state = WeaponState.Idle;
            return;
        }

        if (state === WeaponState.Shoot) {
            console.log("> Shoot");
            shooter.state = WeaponState.Shoot;
            shooter.shootTime = world.elapsedTime;

            const ammo = shooter.ammo[shooter.weaponIndex];
            ammo.loaded--;
            shooter.shootTime = world.elapsedTime;
            this.fireBullets(world, entity);

            return;
        }

        if (state === WeaponState.Swap) {
            console.log("> Swap");
            shooter.state = WeaponState.Swap;
            shooter.swapTime = world.elapsedTime;
            shooter.weaponIndex = input.weaponIndex;
            shooter.weaponIndex = modulo(shooter.weaponIndex, 3);
            return;
        }

        if (state === WeaponState.Cooldown) {
            console.log("> Cooldown");
            shooter.state = WeaponState.Cooldown;
            return;
        }

        if (state === WeaponState.Reload) {
            console.log("> Reload");
            shooter.state = WeaponState.Reload;
            shooter.reloadTime = world.elapsedTime;
            return;
        }

        console.warn(`> No state transition for ${state}`);
    }

    public update(world: World) {
        for (let i = 0; i < this.shooters.entities.length; i++) {
            const entity = this.shooters.entities[i];
            const input = entity.getComponent(Comp.PlayerInput);
            const shooter = entity.getComponent(Comp.Shooter);
            const ammo = shooter.ammo[shooter.weaponIndex];

            const swap = input.weaponIndex !== shooter.weaponIndex;
            const reload = ammo.loaded < 1;

            if (shooter.state === WeaponState.Idle) {
                if (swap) {
                    return this.transition(WeaponState.Swap, entity, world);
                }

                if (reload) {
                    return this.transition(WeaponState.Reload, entity, world);
                }

                if (input.shoot) {
                    return this.transition(WeaponState.Shoot, entity, world);
                }
            }

            if (shooter.state === WeaponState.Swap) {
                const swapDelta = world.elapsedTime - shooter.swapTime;
                if (swapDelta > SWAP_SPEED) {
                    return this.transition(WeaponState.Idle, entity, world);
                }

                if (swap) {
                    return this.transition(WeaponState.Swap, entity, world);
                }
            }

            if (shooter.state === WeaponState.Shoot) {
                return this.transition(WeaponState.Cooldown, entity, world);
            }

            if (shooter.state === WeaponState.Cooldown) {
                const weapon = WeaponSpecs[shooter.weaponIndex];
                const fireRate = weapon.firerate;
                const shootDelta = world.elapsedTime - shooter.shootTime;
                if (shootDelta > fireRate) {
                    this.transition(WeaponState.Idle, entity, world);
                }
            }

            if (shooter.state === WeaponState.Reload) {
                if (swap) {
                    return this.transition(WeaponState.Swap, entity, world);
                }

                const weapon = WeaponSpecs[shooter.weaponIndex];
                const reloadDelta = world.elapsedTime - shooter.reloadTime;
                if (reloadDelta > weapon.reloadSpeed) {
                    ammo.loaded = weapon.maxLoadedAmmo;
                    // TODO - reduce reserved
                    return this.transition(WeaponState.Idle, entity, world);
                }
            }

            /**
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             *
             */

            // // Swap weapon
            // if (input.nextWeapon !== 0) {
            //     console.log("next weapon", input.nextWeapon);
            //     shooter.swapTime = world.elapsedTime;
            //     shooter.weaponIndex += input.nextWeapon;
            //     shooter.weaponIndex = modulo(shooter.weaponIndex, 3);
            // }

            // const swapDelta = world.elapsedTime - shooter.swapTime;
            // if (swapDelta < SWAP_SPEED) {
            //     continue;
            // }

            // // Fire bullet
            // const fireRate = weapon.firerate;
            // const shootDelta = world.elapsedTime - shooter.shootTime;
            // if (input.shoot && shootDelta > fireRate) {
            //     const ammo = shooter.ammo[shooter.weaponIndex];
            //     ammo.loaded--;
            //     shooter.shootTime = world.elapsedTime;
            //     this.fireBullets(world, entity);
            // }
        }
    }

    private fireBullets(world: World, entity: Entity) {
        const position = entity.getComponent(Comp.Position2D);
        const rotation = entity.getComponent(Comp.Rotation2D);
        const shooter = entity.getComponent(Comp.Shooter);
        const weapon = WeaponSpecs[shooter.weaponIndex];

        // Init hitscan
        Hitscan.caster.entity = entity;
        Hitscan.camera.position.set(position.x, 0, position.y);
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
                rsp.entity.hasComponent(Comp.RenderDecalTag)
            ) {
                world.decals.spawn(point, face.normal);
            }

            // Apply damage
            const target = rsp.entity;
            if (target !== undefined && target.hasComponent(Comp.Health)) {
                const health = target.getComponent(Comp.Health);
                health.value -= 25;

                if (health.value <= 0) {
                    world.removeEntity(target);
                }
            }
        }
    }
}
