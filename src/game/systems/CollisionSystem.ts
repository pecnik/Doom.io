import { System, Family, FamilyBuilder, Entity } from "../core/ecs";
import { clamp } from "lodash";
import { World } from "../data/World";
import { Comp } from "../data/Comp";
import { Box3, Vector2 } from "three";
import { onFamilyChange } from "../utils/EntityUtils";
import { Level } from "../data/Level";

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

        onFamilyChange(world, this.bodies, {
            onEntityAdded(entity) {
                const position = entity.getComponent(Comp.Position);
                const collision = entity.getComponent(Comp.Collision);
                collision.next.copy(position);
                collision.prev.copy(position);
            },
        });
    }

    public update(world: World) {
        for (let i = 0; i < this.bodies.entities.length; i++) {
            const entity = this.bodies.entities[i];
            const position = entity.getComponent(Comp.Position);
            const collision = entity.getComponent(Comp.Collision);

            const { prev, next } = collision;
            next.copy(position);

            // Reset flags
            collision.falg.setScalar(0);

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
            const minX = Math.floor(Math.min(prev.x, next.x)) - 2;
            const minY = Math.floor(Math.min(prev.y, next.y)) - 2;
            const minZ = Math.floor(Math.min(prev.z, next.z)) - 2;
            const maxX = Math.ceil(Math.max(prev.x, next.x)) + 2;
            const maxY = Math.ceil(Math.max(prev.y, next.y)) + 2;
            const maxZ = Math.ceil(Math.max(prev.z, next.z)) + 2;

            for (let x = minX; x < maxX; x++) {
                for (let y = minY; y < maxY; y++) {
                    for (let z = minZ; z < maxZ; z++) {
                        const voxel = world.level.getVoxel(x, y, z);
                        if (voxel === undefined) continue;
                        if (voxel.type !== Level.VoxelType.Solid) continue;
                        this.resolveVoxelCollision(world.level, voxel, entity);
                    }
                }
            }

            // Store the new resolved position
            position.copy(next);

            // Store prev position for next update
            prev.copy(next);
        }
    }

    private resolveVoxelCollision(
        level: Level.Level,
        voxel: Level.Voxel,
        entity: Entity
    ) {
        const aabb = new Box3();
        aabb.min.set(voxel.x, voxel.y, voxel.z).subScalar(0.5);
        aabb.max.set(voxel.x, voxel.y, voxel.z).addScalar(0.5);

        const collision = entity.getComponent(Comp.Collision);
        const velocity = entity.getComponent(Comp.Velocity);
        const { prev, next, falg, radius, height } = collision;

        // Test vertical collision
        const playerMinY = Math.min(next.y, prev.y) - height / 2;
        const playerMaxY = Math.max(next.y, prev.y) + height / 2;
        if (playerMinY >= aabb.max.y) return;
        if (playerMaxY <= aabb.min.y) return;

        // Test horizontal collision
        const position2D = new Vector2();
        const collision2D = new Vector2();
        position2D.x = next.x;
        position2D.y = next.z;
        collision2D.x = clamp(next.x, aabb.min.x, aabb.max.x);
        collision2D.y = clamp(next.z, aabb.min.z, aabb.max.z);

        const sqrtDist2D = position2D.distanceToSquared(collision2D);
        if (sqrtDist2D > radius ** 2) {
            return; // No collision
        }

        // Resolve vertical collision
        const floor = aabb.max.y + height / 2;
        if (next.y <= floor && prev.y >= floor) {
            const above = level.getVoxelType(voxel.x, voxel.y + 1, voxel.z);
            if (above === Level.VoxelType.Solid) {
                return; // Ignore, abovr voxel will handle this
            }

            next.y = floor;
            velocity.y = 0;
            falg.y = -1;
            return;
        }

        const ceiling = aabb.min.y - height / 2;
        if (next.y > ceiling && prev.y <= ceiling) {
            next.y = ceiling;
            velocity.y = 0;
            falg.y = 1;
            return;
        }

        // Resolve horizontal collision
        position2D
            .sub(collision2D)
            .normalize()
            .multiplyScalar(radius)
            .add(collision2D);
        next.x = position2D.x;
        next.z = position2D.y;

        if (next.x > aabb.min.x && next.x < aabb.max.x) {
            velocity.z = 0;
            collision.falg.z = 1;
        }

        if (next.z > aabb.min.z && next.z < aabb.max.z) {
            velocity.x = 0;
            collision.falg.x = 1;
        }
    }
}
