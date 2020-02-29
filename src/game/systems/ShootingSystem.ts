import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { random, uniqueId } from "lodash";
import { World } from "../World";
import {
    PositionComponent,
    VelocityComponent,
    LocalPlayerTag,
    RotationComponent,
    ShooterComponent,
    SoundComponent,
    BulletDecalComponent,
    ParticleEmitterComponent
} from "../Components";
import { Input, MouseBtn } from "../core/Input";
import { Vector3 } from "three";

export class ShootingSystem extends System {
    private readonly family: Family;
    private readonly input: Input;

    public constructor(world: World, input: Input) {
        super();
        this.input = input;
        this.family = new FamilyBuilder(world)
            .include(LocalPlayerTag)
            .include(PositionComponent)
            .include(VelocityComponent)
            .include(RotationComponent)
            .include(ShooterComponent)
            .build();
    }

    public update(world: World) {
        const { elapsedTime } = world;
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const shooter = entity.getComponent(ShooterComponent);

            const fireRate = 1 / 8;
            const shootDelta = elapsedTime - shooter.shootTime;
            const shootTriger = this.input.isMouseDown(MouseBtn.Left);
            if (shootTriger && shootDelta > fireRate) {
                shooter.shootTime = elapsedTime;

                // Play sound
                if (entity.hasComponent(SoundComponent)) {
                    const sound = entity.getComponent(SoundComponent);
                    sound.play = true;
                    sound.src = "/assets/sounds/fire.wav";
                }

                const hits = this.hitscan(entity, world);
                for (let i = 0; i < hits.length; i++) {
                    const hit = hits[i];

                    if (hit.face) {
                        const hitPoint = hit.point;
                        const hitNormal = hit.face.normal;
                        this.spawnBulletDecal(hitPoint, hitNormal, world);
                    }

                    break;
                }
            }
        }
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
        position.x = hitPoint.x;
        position.y = hitPoint.y;
        position.z = hitPoint.z;

        const emitter = entity.getComponent(ParticleEmitterComponent);
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
        const position = entity.getComponent(PositionComponent);
        const rotation = entity.getComponent(RotationComponent);
        const shooter = entity.getComponent(ShooterComponent);

        const spread = 0.0;
        shooter.origin.x = random(-spread, spread, true);
        shooter.origin.y = random(-spread, spread, true);

        shooter.camera.copy(world.camera);
        shooter.camera.position.set(position.x, position.y, position.z);
        shooter.camera.rotation.set(rotation.x, rotation.y, 0, "YXZ");

        shooter.raycaster.setFromCamera(shooter.origin, shooter.camera);

        return shooter.raycaster.intersectObject(world.level.scene, true);
    }
}
