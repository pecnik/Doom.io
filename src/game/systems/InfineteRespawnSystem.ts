import { System } from "../ecs";
import { sample } from "lodash";
import { LocalAvatarArchetype } from "../ecs/Archetypes";

export class InfineteRespawnSystem extends System {
    private readonly family = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    public update() {
        this.family.entities.forEach((entity) => {
            if (entity.position.y < -3) {
                const spawn = sample(this.world.level.getSpawnPoints());
                if (spawn !== undefined) {
                    entity.position.copy(spawn);
                    entity.velocity.set(0, 0, 0);
                }
            }
        });
    }
}
