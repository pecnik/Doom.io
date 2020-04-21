import { System, AnyComponents } from "../ecs";
import { World } from "../ecs";
import { Comp } from "../ecs";
import { lerp } from "../core/Utils";
import { isScopeActive, getHeadPosition } from "../utils/Helpers";

class PlayerArchetype implements AnyComponents {
    public input = new Comp.PlayerInput();
    public shooter = new Comp.Shooter();
    public position = new Comp.Position();
    public rotation = new Comp.Rotation2D();
    public collision = new Comp.Collision();
}

export class PlayerCameraSystem extends System {
    private readonly family = this.createEntityFamily({
        archetype: new PlayerArchetype(),
    });

    public update(world: World) {
        this.family.entities.forEach((entity) => {
            const position = getHeadPosition(entity);
            const rotation = entity.rotation;
            world.camera.rotation.set(rotation.x, rotation.y, 0, "YXZ");
            world.camera.position.copy(position);

            const fov = isScopeActive(entity) ? 60 : 90;
            if (world.camera.fov !== fov) {
                world.camera.fov = lerp(world.camera.fov, fov, 10);
                world.camera.updateProjectionMatrix();
            }
        });
    }
}
