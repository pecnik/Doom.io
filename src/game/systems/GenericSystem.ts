import { System, Family, FamilyBuilder, Entity } from "../core/ecs";
import { World } from "../data/World";
import { Comp } from "../data/Comp";
import { JUMP_SPEED } from "../data/Globals";
import { sample } from "lodash";
import { setPosition } from "../utils/Helpers";

export class GenericSystem extends System {
    private readonly family: Family;

    public constructor(world: World) {
        super();
        this.family = new FamilyBuilder(world)
            .include(Comp.Position)
            .include(Comp.Velocity)
            .include(Comp.Collision)
            .build();
    }

    public update(world: World) {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            this.bounceSystem(entity, world);
            this.respawnSystem(entity, world);
        }
    }

    private respawnSystem(entity: Entity, world: World) {
        const position = entity.getComponent(Comp.Position);
        if (position.y < -3) {
            const spawn = sample(world.level.spawnPoints);
            const velocity = entity.getComponent(Comp.Velocity);
            if (spawn !== undefined) {
                setPosition(entity, spawn);
                velocity.set(0, 0, 0);
            }
        }
    }

    private bounceSystem(entity: Entity, world: World) {
        const position = entity.getComponent(Comp.Position);
        const velocity = entity.getComponent(Comp.Velocity);
        const collision = entity.getComponent(Comp.Collision);
        if (collision.falg.y === -1 && velocity.y <= 0) {
            const voxel = world.level.getVoxelAt(position);
            if (voxel !== undefined && voxel.bounce > 0) {
                velocity.y = JUMP_SPEED * Math.sqrt(voxel.bounce);
                velocity.x *= 0.25;
                velocity.z *= 0.25;
            }
        }
    }
}
