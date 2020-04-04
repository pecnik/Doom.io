import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { clamp } from "lodash";
import { World } from "../data/World";
import { Comp } from "../data/Comp";
import { Vector2, Box2, Vector3 } from "three";
import { Level, VoxelType } from "../../editor/Level";

export class CollisionSystem extends System {
    private readonly bodies: Family;
    private readonly colliders: Family;

    public constructor(world: World) {
        super();

        this.bodies = new FamilyBuilder(world)
            .include(Comp.Collision)
            .include(Comp.Position2D)
            .include(Comp.Velocity2D)
            .build();

        this.colliders = new FamilyBuilder(world)
            .include(Comp.Collider)
            .include(Comp.Position2D)
            .build();
    }

    public update(world: World) {
        for (let i = 0; i < this.bodies.entities.length; i++) {
            const entity = this.bodies.entities[i];
            const position = entity.getComponent(Comp.Position2D);
            const velocity = entity.getComponent(Comp.Velocity2D);
            const collision = entity.getComponent(Comp.Collision);

            const { prev, next } = collision;
            next.copy(position);

            // Resolve entity collisions
            const aabb = new Box2();
            for (let j = 0; j < this.colliders.entities.length; j++) {
                const entity = this.colliders.entities[j];
                const collider = entity.getComponent(Comp.Collider);
                const position = entity.getComponent(Comp.Position2D);
                aabb.min.copy(collider.min).add(position);
                aabb.max.copy(collider.max).add(position);
                this.resolve(aabb, collision, velocity);
            }

            // Resolve level collision
            const minX = Math.floor(Math.min(prev.x, next.x)) - 1;
            const minY = Math.floor(Math.min(prev.y, next.y)) - 1;
            const maxX = Math.ceil(Math.max(prev.x, next.x)) + 1;
            const maxY = Math.ceil(Math.max(prev.y, next.y)) + 1;
            for (let y = minY; y < maxY; y++) {
                for (let x = minX; x < maxX; x++) {
                    const index = new Vector3(position.x, 0, position.y);
                    const voxel = Level.getVoxel(world.level.data, index);
                    if (voxel !== undefined && voxel.type === VoxelType.Solid) {
                        // this.resolve(cell.aabb, collision, velocity);
                        // TODO: 3D COLLISION
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
        aabb: Box2,
        collision: Comp.Collision,
        velocity: Comp.Velocity2D
    ) {
        const { next, radius } = collision;
        const coll = new Vector2();
        coll.x = clamp(next.x, aabb.min.x, aabb.max.x);
        coll.y = clamp(next.y, aabb.min.y, aabb.max.y);

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
    }
}
