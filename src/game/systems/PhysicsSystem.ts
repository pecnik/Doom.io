import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { World } from "../data/World";
import { VelocityComponent, PositionComponent } from "../data/Components";
import { Vector2 } from "three";
import { clamp } from "lodash";
import { GRAVITY, FLOOR, CEIL } from "../data/Globals";

export class PhysicsSystem extends System {
    private readonly family: Family;

    public constructor(world: World) {
        super();
        this.family = new FamilyBuilder(world)
            .include(PositionComponent)
            .include(VelocityComponent)
            .build();
    }

    public update(world: World, dt: number) {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const position = entity.getComponent(PositionComponent);
            const velocity = entity.getComponent(VelocityComponent);

            // Apply gravity
            velocity.y -= GRAVITY * dt;

            // Apply velocity
            const prevPos = { ...position };
            const nextPos = { ...position };
            nextPos.x += velocity.x * dt;
            nextPos.y += velocity.y * dt;
            nextPos.z += velocity.z * dt;

            // Vertical collision
            if (nextPos.y < FLOOR) {
                nextPos.y = FLOOR;
                velocity.y = 0;
            }

            if (nextPos.y > CEIL) {
                nextPos.y = CEIL;
                velocity.y = 0;
            }

            // Level collision
            const minX = Math.floor(Math.min(prevPos.x, nextPos.x)) - 1;
            const minZ = Math.floor(Math.min(prevPos.z, nextPos.z)) - 1;
            const maxX = Math.ceil(Math.max(prevPos.x, nextPos.x)) + 1;
            const maxZ = Math.ceil(Math.max(prevPos.z, nextPos.z)) + 1;
            for (let z = minZ; z < maxZ; z++) {
                for (let x = minX; x < maxX; x++) {
                    const cell = world.level.getCell(x, z);
                    if (cell === undefined) continue;
                    if (cell.wall === false) continue;

                    // Test horizontal collision
                    const body = new Vector2();
                    body.x = nextPos.x;
                    body.y = nextPos.z;

                    const coll = new Vector2();
                    coll.x = clamp(body.x, cell.aabb.min.x, cell.aabb.max.x);
                    coll.y = clamp(body.y, cell.aabb.min.z, cell.aabb.max.z);

                    // Resolve horizontal collision
                    const radius = 0.2;
                    if (body.distanceToSquared(coll) < radius ** 2) {
                        body.sub(coll)
                            .normalize()
                            .multiplyScalar(radius)
                            .add(coll);
                        nextPos.x = body.x;
                        nextPos.z = body.y;

                        if (
                            body.x > cell.aabb.min.x &&
                            body.x < cell.aabb.max.x
                        ) {
                            velocity.z = 0;
                        }

                        if (
                            body.y > cell.aabb.min.y &&
                            body.y < cell.aabb.max.y
                        ) {
                            velocity.x = 0;
                        }
                    }
                }
            }

            // Apply position
            position.x = nextPos.x;
            position.y = nextPos.y;
            position.z = nextPos.z;
        }
    }
}
