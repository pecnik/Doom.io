import { System, Entity, AnyComponents } from "../ecs";
import { clamp } from "lodash";
import { Components } from "../ecs";
import { Vector2 } from "three";
import { LevelBlock } from "../../editor/Level";
import { GRAVITY } from "../data/Globals";

class Archetype implements AnyComponents {
    public position = new Components.Position();
    public velocity = new Components.Velocity();
    public collision = new Components.Collision();
}

export class PhysicsSystem extends System {
    private readonly family = this.createEntityFamily({
        archetype: new Archetype(),
    });

    public update(dt: number) {
        this.family.entities.forEach((entity) => {
            const { position, velocity, collision } = entity;

            const { prev, next, height } = collision;

            // Apply gravity
            velocity.y -= GRAVITY * dt;

            // Apply velocity
            prev.copy(position);
            next.copy(position);
            next.x += velocity.x * dt;
            next.y += velocity.y * dt;
            next.z += velocity.z * dt;

            // Reset flags
            collision.falg.setScalar(0);

            // Resolve level collision
            const minX = Math.floor(Math.min(prev.x, next.x)) - 2;
            const minY = Math.floor(Math.min(prev.y, next.y)) - 2;
            const minZ = Math.floor(Math.min(prev.z, next.z)) - 2;
            const maxX = Math.ceil(Math.max(prev.x, next.x)) + 2;
            const maxY = Math.ceil(Math.max(prev.y, next.y) + height) + 2;
            const maxZ = Math.ceil(Math.max(prev.z, next.z)) + 2;

            for (let x = minX; x < maxX; x++) {
                for (let y = minY; y < maxY; y++) {
                    for (let z = minZ; z < maxZ; z++) {
                        const block = this.world.level.getBlock(x, y, z);
                        if (block !== undefined && block.solid) {
                            this.resolveVBlockCollision(block, entity);
                        }
                    }
                }
            }

            // Store the new resolved position
            position.copy(next);
        });
    }

    private resolveVBlockCollision(
        block: LevelBlock,
        entity: Entity<Archetype>
    ) {
        const { level } = this.world;

        const box = block.aabb;

        const collision = entity.collision;
        const velocity = entity.velocity;
        const { prev, next, falg, radius, height } = collision;

        // Test vertical collision
        const playerMinY = Math.min(next.y, prev.y);
        const playerMaxY = Math.max(next.y, prev.y) + height;
        if (playerMinY >= box.max.y) return;
        if (playerMaxY <= box.min.y) return;

        // Test horizontal collision
        const position2D = new Vector2();
        const collision2D = new Vector2();
        position2D.x = next.x;
        position2D.y = next.z;
        collision2D.x = clamp(next.x, box.min.x, box.max.x);
        collision2D.y = clamp(next.z, box.min.z, box.max.z);

        const sqrtDist2D = position2D.distanceToSquared(collision2D);
        if (sqrtDist2D > radius ** 2) {
            return; // No collision
        }

        // Resolve vertical collision
        const floor = box.max.y;
        if (next.y <= floor && prev.y >= floor) {
            if (
                level.isBlockSolid(
                    block.origin.x,
                    block.origin.y + 1,
                    block.origin.z
                )
            ) {
                return; // Ignore, abovr voxel will handle this
            }

            next.y = floor;
            velocity.y = 0;
            falg.y = -1;
            return;
        }

        const ceiling = box.min.y - height;
        if (next.y > ceiling && prev.y <= ceiling) {
            if (
                level.isBlockSolid(
                    block.origin.x,
                    block.origin.y - 1,
                    block.origin.z
                )
            ) {
                return; // Ignore, abovr voxel will handle this
            }

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

        if (next.x > box.min.x && next.x < box.max.x) {
            velocity.z = 0;
            collision.falg.z = 1;
        }

        if (next.z > box.min.z && next.z < box.max.z) {
            velocity.x = 0;
            collision.falg.x = 1;
        }
    }
}
