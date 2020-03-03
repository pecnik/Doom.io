import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { World } from "../World";
import { modulo, lerp } from "../core/Utils";
import { clamp } from "lodash";
import {
    VelocityComponent,
    RotationComponent,
    ControllerComponent
} from "../Components";
import { Vector2 } from "three";
import { RUN_SPEED } from "../Globals";

export class MovementSystem extends System {
    private readonly family: Family;

    public constructor(world: World) {
        super();
        this.family = new FamilyBuilder(world)
            .include(ControllerComponent)
            .include(VelocityComponent)
            .include(RotationComponent)
            .build();
    }

    public update() {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const controller = entity.getComponent(ControllerComponent);
            const velocity = entity.getComponent(VelocityComponent);
            const rotation = entity.getComponent(RotationComponent);

            // Move
            const movement = controller.move.clone();
            movement.normalize();
            movement.multiplyScalar(RUN_SPEED);
            if (movement.x !== 0 || movement.y !== 0) {
                movement.rotateAround(new Vector2(), -rotation.y);
            }

            velocity.x = lerp(velocity.x, movement.x, RUN_SPEED / 4);
            velocity.z = lerp(velocity.z, movement.y, RUN_SPEED / 4);

            // Look
            rotation.y -= controller.look.y;
            rotation.x -= controller.look.x;
            rotation.y = modulo(rotation.y, Math.PI * 2);
            rotation.x = clamp(rotation.x, -Math.PI / 2, Math.PI / 2);
        }
    }
}
