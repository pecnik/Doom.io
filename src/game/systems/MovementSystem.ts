import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { World } from "../World";
import { lerp } from "../core/Utils";
import { clamp } from "lodash";
import {
    VelocityComponent,
    RotationComponent,
    InputComponent
} from "../Components";
import { Vector2 } from "three";
import { RUN_SPEED, WALK_SPEED } from "../Globals";

export class MovementSystem extends System {
    private readonly family: Family;

    public constructor(world: World) {
        super();
        this.family = new FamilyBuilder(world)
            .include(InputComponent)
            .include(VelocityComponent)
            .include(RotationComponent)
            .build();
    }

    public update() {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const input = entity.getComponent(InputComponent);
            const velocity = entity.getComponent(VelocityComponent);
            const rotation = entity.getComponent(RotationComponent);

            // Move
            const movement = input.move.clone();
            movement.normalize();

            const speed = input.walk ? WALK_SPEED : RUN_SPEED;
            movement.multiplyScalar(speed);
            if (movement.x !== 0 || movement.y !== 0) {
                movement.rotateAround(new Vector2(), -rotation.y);
            }

            velocity.x = lerp(velocity.x, movement.x, RUN_SPEED / 4);
            velocity.z = lerp(velocity.z, movement.y, RUN_SPEED / 4);

            rotation.x = clamp(rotation.x, -Math.PI / 2, Math.PI / 2);
        }
    }
}
