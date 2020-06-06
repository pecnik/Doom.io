import { System } from "../ecs";
import { ProjectileArchetype } from "../ecs/Archetypes";

export class ProjectileDisposalSystem extends System {
    private readonly family = this.createEntityFamily({
        archetype: new ProjectileArchetype(),
    });

    public update() {
        this.family.entities.forEach((projectile) => {
            const spawnTime = projectile.projectile.spawnTime;
            const elapsed = this.world.elapsedTime - spawnTime;
            if (elapsed > 2 || projectile.collision.falg.lengthSq() > 0.01) {
                this.world.removeEntity(projectile.id);
            }
        });
    }
}
