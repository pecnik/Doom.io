import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { clamp } from "lodash";
import { World } from "../data/World";
import { Comp } from "../data/Comp";
import { Vector3, Box3 } from "three";
import { Level, VoxelType } from "../../editor/Level";

export class CollisionSystem extends System {
    private readonly bodies: Family;
    // private readonly colliders: Family;

    public constructor(world: World) {
        super();

        this.bodies = new FamilyBuilder(world)
            .include(Comp.Collision)
            .include(Comp.Position)
            .include(Comp.Velocity)
            .build();

        // this.colliders = new FamilyBuilder(world)
        //     .include(Comp.Collider)
        //     .include(Comp.Position)
        //     .build();
    }

    public update(world: World) {
        const level = world.level.data;

        for (let i = 0; i < this.bodies.entities.length; i++) {
            const entity = this.bodies.entities[i];
            const position = entity.getComponent(Comp.Position);
            const velocity = entity.getComponent(Comp.Velocity);
            const collision = entity.getComponent(Comp.Collision);

            const { prev, next } = collision;
            next.copy(position);

            // TODO
            // // Resolve entity collisions
            // const aabb = new Box2();
            // for (let j = 0; j < this.colliders.entities.length; j++) {
            //     const entity = this.colliders.entities[j];
            //     const collider = entity.getComponent(Comp.Collider);
            //     const position = entity.getComponent(Comp.Position);
            //     aabb.min.copy(collider.min).add(position);
            //     aabb.max.copy(collider.max).add(position);
            //     this.resolve(aabb, collision, velocity);
            // }

            // Resolve level collision
            const minX = Math.floor(Math.min(prev.x, next.x)) - 1;
            const minY = Math.floor(Math.min(prev.y, next.y)) - 1;
            const minZ = Math.floor(Math.min(prev.z, next.z)) - 1;
            const maxX = Math.ceil(Math.max(prev.x, next.x)) + 1;
            const maxY = Math.ceil(Math.max(prev.y, next.y)) + 1;
            const maxZ = Math.ceil(Math.max(prev.z, next.z)) + 1;

            const index = new Vector3();
            const aabb = new Box3();
            for (let x = minX; x < maxX; x++) {
                for (let y = minY; y < maxY; y++) {
                    for (let z = minZ; z < maxZ; z++) {
                        const voxel = Level.getVoxel(level, index.set(x, y, z));
                        if (voxel === undefined) continue;
                        if (voxel.type !== VoxelType.Solid) continue;
                        aabb.min.set(voxel.x, voxel.y, voxel.z).subScalar(0.5);
                        aabb.max.set(voxel.x, voxel.y, voxel.z).addScalar(0.5);
                        this.resolve(aabb, collision, velocity);
                    }
                }
            }

            // Store the new resolved position
            position.copy(next);

            // Store prev position for next update
            prev.copy(next);
        }
    }

    private resolve(
        aabb: Box3,
        collision: Comp.Collision,
        velocity: Comp.Velocity
    ) {
        const { next, radius } = collision;
        const coll = new Vector3();
        coll.x = clamp(next.x, aabb.min.x, aabb.max.x);
        coll.y = clamp(next.y, aabb.min.y, aabb.max.y);
        coll.z = clamp(next.z, aabb.min.z, aabb.max.z);

        if (next.distanceToSquared(coll) >= radius ** 2) {
            return;
        }

        next.sub(coll).normalize().multiplyScalar(radius).add(coll);

        if (next.x > aabb.min.x && next.x < aabb.max.x) {
            velocity.y = 0;
        }

        if (next.y > aabb.min.y && next.y < aabb.max.y) {
            velocity.x = 0;
        }

        if (next.z > aabb.min.z && next.z < aabb.max.z) {
            velocity.x = 0;
        }
    }
}
