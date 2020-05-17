import { System } from "../../ecs";
import { PickupArchetype } from "../../ecs/Archetypes";
import { getEntityMesh } from "../../Helpers";

export class PickupMeshSystem extends System {
    private readonly family = this.createEntityFamily({
        archetype: new PickupArchetype(),
    });

    public update(dt: number) {
        this.family.entities.forEach((avatar) => {
            const mesh = getEntityMesh(this.world, avatar);
            if (mesh !== undefined) {
                mesh.rotation.y += 2 * dt;
                mesh.rotation.y %= Math.PI * 2;

                mesh.position.copy(avatar.position);
                mesh.position.y += Math.sin(mesh.rotation.y * 3) * 0.05 + 0.1;
            }
        });
    }
}
