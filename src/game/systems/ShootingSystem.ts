import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { random, uniqueId } from "lodash";
import { World } from "../World";
import {
    PositionComponent,
    VelocityComponent,
    RotationComponent,
    ShooterComponent,
    SoundComponent,
    BulletDecalComponent,
    ParticleEmitterComponent,
    ControllerComponent,
    HealthComponent,
    Object3DComponent
} from "../Components";
import { Vector3, Intersection } from "three";

export class ShootingSystem extends System {
    private readonly shooterFamily: Family;
    private readonly targetFamily: Family;

    public constructor(world: World) {
        super();

        this.shooterFamily = new FamilyBuilder(world)
            .include(ControllerComponent)
            .include(PositionComponent)
            .include(VelocityComponent)
            .include(RotationComponent)
            .include(ShooterComponent)
            .build();

        this.targetFamily = new FamilyBuilder(world)
            .include(HealthComponent)
            .include(Object3DComponent)
            .build();
    }

    public update(world: World) {
        const { elapsedTime } = world;
        for (let i = 0; i < this.shooterFamily.entities.length; i++) {
            const entity = this.shooterFamily.entities[i];
            const shooter = entity.getComponent(ShooterComponent);
            const controller = entity.getComponent(ControllerComponent);

            const fireRate = 1 / 4;
            const shootDelta = elapsedTime - shooter.shootTime;
            if (controller.shoot && shootDelta > fireRate) {
                shooter.shootTime = elapsedTime;

                // Play sound
                if (entity.hasComponent(SoundComponent)) {
                    const sound = entity.getComponent(SoundComponent);
                    sound.play = true;
                    sound.src = "/assets/sounds/fire.wav";
                }

                // Hitscan
                const response = this.hitscan(entity, world);
                if (!response.ray) continue;
                if (!response.ray.face) continue;

                if (response.entity) {
                    // Hit target - kill target
                    const entity = response.entity;
                    const health = entity.getComponent(HealthComponent);
                    health.value -= 35;
                    this.spawnBlood(response.ray.point, world);

                    if (health.value <= 0) {
                        health.value = 0;
                        world.removeEntity(entity);
                    }
                } else {
                    // Hit level wall - spawn bullet decal
                    this.spawnBulletDecal(
                        response.ray.point,
                        response.ray.face.normal,
                        world
                    );
                }
            }
        }
    }

    private spawnBlood(hitPoint: Vector3, world: World) {
        const entity = new Entity();
        entity.id = uniqueId("blood");
        entity.putComponent(PositionComponent);
        entity.putComponent(ParticleEmitterComponent);

        const position = entity.getComponent(PositionComponent);
        position.copy(hitPoint);

        const emitter = entity.getComponent(ParticleEmitterComponent);
        emitter.color.set(0xff0000);
        emitter.particles = 128;
        emitter.times = 1;

        world.addEntity(entity);
    }

    private spawnBulletDecal(
        hitPoint: Vector3,
        hitNormal: Vector3,
        world: World
    ) {
        const entity = new Entity();
        entity.id = uniqueId("decal");
        entity.putComponent(BulletDecalComponent);
        entity.putComponent(PositionComponent);
        entity.putComponent(ParticleEmitterComponent);

        const position = entity.getComponent(PositionComponent);
        position.copy(hitPoint);

        const emitter = entity.getComponent(ParticleEmitterComponent);
        emitter.direction.copy(hitNormal);
        emitter.color.set(0x000000);
        emitter.particles = 3;
        emitter.times = 1;

        const decal = entity.getComponent(BulletDecalComponent);
        decal.spawnTime = world.elapsedTime;

        if (Math.abs(hitNormal.x) === 1) {
            decal.axis = "x";
            decal.facing = hitNormal.x as -1 | 1;
        } else if (Math.abs(hitNormal.y) === 1) {
            decal.axis = "y";
            decal.facing = hitNormal.y as -1 | 1;
        } else if (Math.abs(hitNormal.z) === 1) {
            decal.axis = "z";
            decal.facing = hitNormal.z as -1 | 1;
        }

        world.addEntity(entity);
    }

    private hitscan(entity: Entity, world: World) {
        // Response data
        const response: {
            ray?: Intersection;
            entity?: Entity;
        } = {};

        // Update raycaster
        const position = entity.getComponent(PositionComponent);
        const rotation = entity.getComponent(RotationComponent);
        const shooter = entity.getComponent(ShooterComponent);

        const spread = 0.0;
        shooter.origin.x = random(-spread, spread, true);
        shooter.origin.y = random(-spread, spread, true);

        shooter.camera.position.set(position.x, position.y, position.z);
        shooter.camera.rotation.set(rotation.x, rotation.y, 0, "YXZ");
        shooter.camera.updateWorldMatrix(false, false);

        shooter.raycaster.setFromCamera(shooter.origin, shooter.camera);

        // Level hitscan
        const level = world.level.scene;
        const rays = shooter.raycaster.intersectObject(level, true);
        response.ray = rays[0];

        // Entity hitscan
        for (let i = 0; i < this.targetFamily.entities.length; i++) {
            const entity = this.targetFamily.entities[i];
            const object3D = entity.getComponent(Object3DComponent);

            const rays = shooter.raycaster.intersectObject(object3D, true);
            for (let i = 0; i < rays.length; i++) {
                const ray = rays[i];

                if (response.ray === undefined) {
                    response.ray = ray;
                    response.entity = entity;
                    continue;
                }

                if (
                    ray.point.distanceToSquared(position) <
                    response.ray.point.distanceToSquared(position)
                ) {
                    response.ray = ray;
                    response.entity = entity;
                    continue;
                }
            }
        }

        return response;
    }
}
