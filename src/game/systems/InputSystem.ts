import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { World } from "../World";
import { Input, KeyCode, MouseBtn } from "../core/Input";
import { LocalPlayerTag, ControllerComponent } from "../Components";

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

            // Look input
            const mouseSensitivity = 0.1;
            const lookHor = this.input.mouse.dx;
            const lookVer = this.input.mouse.dy;
            controller.look.y = lookHor * mouseSensitivity * dt;
            controller.look.x = lookVer * mouseSensitivity * dt;

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

            // Shoot
            controller.shoot = this.input.isMouseDown(MouseBtn.Left);
        }
    }
}
