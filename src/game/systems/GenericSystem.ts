import { System, Entity } from "../ecs";
import { World } from "../ecs";
import { Components } from "../ecs";
import { JUMP_SPEED } from "../data/Globals";
import { sample } from "lodash";

class Archetype {
    position = new Components.Position();
    velocity = new Components.Velocity();
    collision = new Components.Collision();
}

export class GenericSystem extends System {
    private readonly family = this.createEntityFamily({
        archetype: new Archetype(),
    });

    public update(world: World) {
        this.family.entities.forEach((entity) => {
            this.bounceSystem(entity, world);
            this.respawnSystem(entity, world);
        });
    }

    private respawnSystem(entity: Entity<Archetype>, world: World) {
        if (entity.position.y < -3) {
            const spawn = sample(world.level.spawnPoints);
            if (spawn !== undefined) {
                entity.position.copy(spawn);
                entity.velocity.set(0, 0, 0);
            }
        }
    }

    private bounceSystem(entity: Entity<Archetype>, world: World) {
        const { position, velocity, collision } = entity;
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
