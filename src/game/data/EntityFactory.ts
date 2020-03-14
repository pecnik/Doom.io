import { Entity } from "@nova-engine/ecs";
import { uniqueId } from "lodash";
import {
    LocalPlayerTag,
    PovComponent,
    HealthComponent,
    InputComponent,
    Object3DComponent,
    PositionComponent,
    VelocityComponent,
    RotationComponent,
    FootstepComponent,
    ShooterComponent,
    SoundComponent,
    JumpComponent,
    BulletDecalComponent,
    ParticleEmitterComponent
} from "./Components";
import { Vector3 } from "three";

export module EntityFactory {
    export function Player(id = uniqueId("e-")) {
        const player = new Entity();
        player.id = id;
        player.putComponent(LocalPlayerTag);
        player.putComponent(PovComponent);
        player.putComponent(HealthComponent);
        player.putComponent(InputComponent);
        player.putComponent(Object3DComponent);
        player.putComponent(PositionComponent);
        player.putComponent(VelocityComponent);
        player.putComponent(RotationComponent);
        player.putComponent(FootstepComponent);
        player.putComponent(ShooterComponent);
        player.putComponent(SoundComponent);
        player.putComponent(JumpComponent);
        return player;
    }

    export function BloodSquirt(id = uniqueId("e-"), position: Vector3) {
        const entity = new Entity();
        entity.id = id;
        entity.putComponent(PositionComponent).copy(position);
        entity.putComponent(ParticleEmitterComponent);

        const emitter = entity.getComponent(ParticleEmitterComponent);
        emitter.color.set(0xff0000);
        emitter.particles = 128;
        emitter.times = 1;

        return entity;
    }

    export function BulletDecal(
        id = uniqueId("e-"),
        position: Vector3,
        normal: Vector3
    ) {
        const entity = new Entity();
        entity.id = id;
        entity.putComponent(PositionComponent).copy(position);
        entity.putComponent(BulletDecalComponent);
        entity.putComponent(ParticleEmitterComponent);

        const emitter = entity.getComponent(ParticleEmitterComponent);
        emitter.direction.copy(normal);
        emitter.color.set(0x000000);
        emitter.particles = 3;
        emitter.times = 1;

        const decal = entity.getComponent(BulletDecalComponent);
        if (Math.abs(normal.x) === 1) {
            decal.axis = "x";
            decal.facing = normal.x as -1 | 1;
        } else if (Math.abs(normal.y) === 1) {
            decal.axis = "y";
            decal.facing = normal.y as -1 | 1;
        } else if (Math.abs(normal.z) === 1) {
            decal.axis = "z";
            decal.facing = normal.z as -1 | 1;
        }

        return entity;
    }
}
