import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { World } from "../World";
import {
    PositionComponent,
    VelocityComponent,
    JumpComponent,
    LocalPlayerTag,
    ControllerComponent
} from "../Components";
import { JUMP_SPEED, FLOOR } from "../Globals";

export class JumpingSystem extends System {
    private readonly family: Family;

    public constructor(world: World) {
        super();
        this.family = new FamilyBuilder(world)
            .include(LocalPlayerTag)
            .include(ControllerComponent)
            .include(PositionComponent)
            .include(VelocityComponent)
            .include(JumpComponent)
            .build();
    }

    public update(world: World) {
        const { elapsedTime } = world;
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const controller = entity.getComponent(ControllerComponent);
            const position = entity.getComponent(PositionComponent);
            const velocity = entity.getComponent(VelocityComponent);
            const jump = entity.getComponent(JumpComponent);

            if (controller.jump === 1) {
                jump.triggerTime = elapsedTime;
            }

            if (position.y === FLOOR) {
                jump.coyoteTime = elapsedTime;
            }

            const tdelta = elapsedTime - jump.triggerTime;
            const cdelta = elapsedTime - jump.coyoteTime;
            if (tdelta < 0.1 && cdelta < 0.1 && velocity.y <= 0) {
                velocity.y = JUMP_SPEED;
            }

            // Halt jump
            if (controller.jump === -1) {
                velocity.y *= 0.5;
            }
        }
    }
}
