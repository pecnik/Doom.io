import { Entity, Component } from "@nova-engine/ecs";
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
    ParticleEmitterComponent,
    MeshComponent,
    ColliderComponent
} from "./Components";
import { Vector3 } from "three";

export module EntityFactory {
    export function Player() {
        return new EntityBuilder()
            .setPlayer()
            .setShooter()
            .setPhysicsBody()
            .setDestructible()
            .build();
    }

    export function Block() {
        const entity = new EntityBuilder().setRenderMesh().build();
        entity.getComponent(MeshComponent).src = "/assets/models/metal_box.glb";
        return entity;
    }

    export function Barrel() {
        const barrel = new EntityBuilder()
            .setRenderMesh()
            .setDestructible()
            .build();
        barrel.getComponent(MeshComponent).src = "/assets/models/barrel.glb";
        return barrel;
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

export class EntityBuilder {
    private readonly entity = new Entity();
    private readonly comps = new Array<new () => Component>();

    public setPlayer() {
        this.comps.push(
            LocalPlayerTag,
            PovComponent,
            InputComponent,
            JumpComponent,
            PositionComponent,
            VelocityComponent,
            FootstepComponent
        );
        return this;
    }

    public setCollidable() {
        this.comps.push(
            PositionComponent,
            Object3DComponent,
            ColliderComponent,
            MeshComponent
        );
        return this;
    }

    public setRenderMesh() {
        this.comps.push(PositionComponent, Object3DComponent, MeshComponent);
        return this;
    }

    public setShooter() {
        this.comps.push(ShooterComponent, SoundComponent);
        return this;
    }

    public setPhysicsBody() {
        this.comps.push(
            PositionComponent,
            RotationComponent,
            VelocityComponent
        );
        return this;
    }

    public setDestructible() {
        this.comps.push(HealthComponent, Object3DComponent, MeshComponent);
        return this;
    }

    public build() {
        this.entity.id = uniqueId("e-");
        this.comps.forEach(key => {
            if (!this.entity.hasComponent(key)) {
                this.entity.putComponent(key);
            }
        });
        return this.entity;
    }
}
