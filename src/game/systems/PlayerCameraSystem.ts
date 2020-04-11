import { System, Family, FamilyBuilder } from "../core/ecs";
import { World } from "../data/World";
import { Comp } from "../data/Comp";
import { lerp } from "../core/Utils";
import { isScopeActive, getHeadPosition } from "../utils/Helpers";

export class PlayerCameraSystem extends System {
    private readonly family: Family;

    public constructor(world: World) {
        super();
        this.family = new FamilyBuilder(world)
            .include(Comp.PlayerInput)
            .include(Comp.Position)
            .include(Comp.Rotation2D)
            .include(Comp.Collision)
            .build();
    }

    public update(world: World) {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const position = getHeadPosition(entity);
            const rotation = entity.getComponent(Comp.Rotation2D);
            world.camera.rotation.set(rotation.x, rotation.y, 0, "YXZ");
            world.camera.position.copy(position);

            const fov = isScopeActive(entity) ? 60 : 90;
            if (world.camera.fov !== fov) {
                world.camera.fov = lerp(world.camera.fov, fov, 10);
                world.camera.updateProjectionMatrix();
            }
        }
    }
}
