import { System, Entity } from "../ecs";
import { Components } from "../ecs";
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

    public update() {
        this.family.entities.forEach((entity) => {
            this.respawnSystem(entity);
        });
    }

    private respawnSystem(entity: Entity<Archetype>) {
        if (entity.position.y < -3) {
            const spawn = sample(this.world.level.spawnPoints);
            if (spawn !== undefined) {
                entity.position.copy(spawn);
                entity.velocity.set(0, 0, 0);
            }
        }
    }
}
