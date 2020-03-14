import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { random, uniqueId } from "lodash";
import { World } from "../data/World";
import {
    PositionComponent,
    VelocityComponent,
    RotationComponent,
    ShooterComponent,
    SoundComponent,
    InputComponent,
    HealthComponent,
    Object3DComponent,
    MeshComponent
} from "../data/Components";
import { Intersection } from "three";
import { EntityFactory } from "../data/EntityFactory";

export class ShootingSystem extends System {
    private readonly shooterFamily: Family;
    private readonly targetFamily: Family;

    public constructor(world: World) {
        super();

        this.shooterFamily = new FamilyBuilder(world)
            .include(InputComponent)
            .include(PositionComponent)
            .include(VelocityComponent)
            .include(RotationComponent)
            .include(ShooterComponent)
            .build();

        this.targetFamily = new FamilyBuilder(world)
            .include(Object3DComponent)
            .include(MeshComponent)
            .build();
    }

    public update(world: World) {
        const { elapsedTime } = world;
        for (let i = 0; i < this.shooterFamily.entities.length; i++) {
            const entity = this.shooterFamily.entities[i];
            const shooter = entity.getComponent(ShooterComponent);
            const input = entity.getComponent(InputComponent);

            const fireRate = 1 / 4;
            const shootDelta = elapsedTime - shooter.shootTime;
            if (input.shoot && shootDelta > fireRate) {
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

                // Hit wall
                if (response.entity === undefined) {
                    world.addEntities(
                        EntityFactory.BulletDecal(
                            uniqueId("decal-"),
                            response.ray.point,
                            response.ray.face.normal
                        )
                    );
                    continue;
                }

                if (response.entity.hasComponent(HealthComponent)) {
                    const entity = response.entity;
                    const health = entity.getComponent(HealthComponent);
                    health.value -= 35;

                    world.addEntity(
                        EntityFactory.BloodSquirt(
                            uniqueId("blood"),
                            response.ray.point
                        )
                    );

                    if (health.value <= 0) {
                        health.value = 0;
                        world.removeEntity(entity);
                    }
                } else {
                    world.addEntities(
                        EntityFactory.BulletDecal(
                            uniqueId("decal-"),
                            response.ray.point,
                            response.ray.face.normal
                        )
                    );
                }
            }
        }
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
            const target = this.targetFamily.entities[i];
            const object3D = target.getComponent(Object3DComponent);
            if (target === entity) continue;

            const rays = shooter.raycaster.intersectObject(object3D, true);
            for (let i = 0; i < rays.length; i++) {
                const ray = rays[i];

                if (response.ray === undefined) {
                    response.ray = ray;
                    response.entity = target;
                    continue;
                }

                if (
                    ray.point.distanceToSquared(position) <
                    response.ray.point.distanceToSquared(position)
                ) {
                    response.ray = ray;
                    response.entity = target;
                    continue;
                }
            }
        }

        return response;
    }
}
