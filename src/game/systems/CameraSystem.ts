import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { World } from "../World";
import {
    VelocityComponent,
    RotationComponent,
    PositionComponent,
    LocalPlayerTag
} from "../Components";

export class CameraSystem extends System {
    private readonly family: Family;

    public constructor(world: World) {
        super();
        this.family = new FamilyBuilder(world)
            .include(LocalPlayerTag)
            .include(PositionComponent)
            .include(VelocityComponent)
            .build();
    }

    public update(world: World) {
        for (let i = 0; i < this.family.entities.length; i++) {
            const avatar = this.family.entities[i];
            const position = avatar.getComponent(PositionComponent);
            const rotation = avatar.getComponent(RotationComponent);
            world.camera.position.set(
                position.x,
                position.y - 0.125,
                position.z
            );
            world.camera.rotation.set(rotation.x, rotation.y, 0, "YXZ");
        }
    }
}
