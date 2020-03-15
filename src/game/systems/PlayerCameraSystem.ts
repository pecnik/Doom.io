import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { World } from "../data/World";
import { Comp } from "../data/Comp";

export class PlayerCameraSystem extends System {
    private readonly family: Family;

    public constructor(world: World) {
        super();
        this.family = new FamilyBuilder(world)
            .include(Comp.PlayerInput)
            .include(Comp.Position2D)
            .include(Comp.Rotation2D)
            .build();
    }

    public update(world: World) {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const input = entity.getComponent(Comp.PlayerInput);
            const position = entity.getComponent(Comp.Position2D);
            const rotation = entity.getComponent(Comp.Rotation2D);
            world.camera.position.set(position.x, 0, position.y);
            world.camera.rotation.set(rotation.x, rotation.y, 0, "YXZ");

            const fov = input.scope ? 60 : 90;
            if (world.camera.fov !== fov) {
                world.camera.fov = fov;
                world.camera.updateProjectionMatrix();
            }
        }
    }
}
