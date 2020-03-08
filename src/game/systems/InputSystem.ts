import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { World } from "../World";
import { Input, KeyCode, MouseBtn } from "../core/Input";
import {
    LocalPlayerTag,
    ControllerComponent,
    RotationComponent
} from "../Components";

export class InputSystem extends System {
    private readonly family: Family;
    private readonly input: Input;

    public constructor(world: World, input: Input) {
        super();
        this.input = input;
        this.family = new FamilyBuilder(world)
            .include(LocalPlayerTag)
            .include(ControllerComponent)
            .build();
    }

    public update(_: World, dt: number) {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const controller = entity.getComponent(ControllerComponent);
            const rotation = entity.getComponent(RotationComponent);

            // Action cotnrolls
            controller.walk = this.input.isKeyDown(KeyCode.SHIFT);
            controller.shoot = this.input.isMouseDown(MouseBtn.Left);
            controller.scope = this.input.isMouseDown(MouseBtn.Right);
            if (controller.scope) {
                controller.walk = true;
            }

            // Look input
            const mouseSensitivity = 0.1;
            const lookHor = this.input.mouse.dx;
            const lookVer = this.input.mouse.dy;

            const str = controller.scope ? 0.5 : 1;
            rotation.y -= lookHor * mouseSensitivity * dt * str;
            rotation.x -= lookVer * mouseSensitivity * dt * str;

            // Move
            const forward = this.input.isKeyDown(KeyCode.W);
            const backward = this.input.isKeyDown(KeyCode.S);
            const left = this.input.isKeyDown(KeyCode.A);
            const right = this.input.isKeyDown(KeyCode.D);
            controller.move.y = (forward ? -1 : 0) + (backward ? 1 : 0);
            controller.move.x = (left ? -1 : 0) + (right ? 1 : 0);

            // Jump
            controller.jump = 0;
            if (this.input.isKeyPressed(KeyCode.SPACE)) controller.jump = 1;
            if (this.input.isKeyReleased(KeyCode.SPACE)) controller.jump = -1;
        }
    }
}
