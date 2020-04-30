import { System, AnyComponents } from "../ecs";
import { Components } from "../ecs";
import { lerp } from "../core/Utils";
import { isScopeActive, getHeadPosition } from "../Helpers";

class PlayerArchetype implements AnyComponents {
    public input = new Components.Input();
    public shooter = new Components.Shooter();
    public position = new Components.Position();
    public rotation = new Components.Rotation();
    public collision = new Components.Collision();
}

export class PlayerCameraSystem extends System {
    private readonly family = this.createEntityFamily({
        archetype: new PlayerArchetype(),
    });

    public update() {
        this.family.entities.forEach((entity) => {
            const position = getHeadPosition(entity);
            const rotation = entity.rotation;

            const { camera } = this.engine;
            camera.rotation.set(rotation.x, rotation.y, 0, "YXZ");
            camera.position.copy(position);

            const fov = isScopeActive(entity) ? 60 : 90;
            if (camera.fov !== fov) {
                camera.fov = lerp(camera.fov, fov, 10);
                camera.updateProjectionMatrix();
            }
        });
    }
}
