import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { clamp } from "lodash";
import { World } from "../data/World";
import { Comp } from "../data/Comp";
import { Input, KeyCode, MouseBtn } from "../core/Input";
import { modulo } from "../core/Utils";

export class PlayerInputSystem extends System {
    private readonly input: Input;
    private readonly family: Family;

    public constructor(world: World, input: Input) {
        super();
        this.input = input;
        this.family = new FamilyBuilder(world)
            .include(Comp.PlayerInput)
            .build();
    }

    public update(_: World, dt: number) {
        // Look input
        const mouseSensitivity = 0.1;
        const lookHor = this.input.mouse.dx;
        const lookVer = this.input.mouse.dy;

        // Move
        const forward = this.input.isKeyDown(KeyCode.W);
        const backward = this.input.isKeyDown(KeyCode.S);
        const left = this.input.isKeyDown(KeyCode.A);
        const right = this.input.isKeyDown(KeyCode.D);
        const jump = this.input.isKeyPressed(KeyCode.SPACE);
        const walk = this.input.isKeyDown(KeyCode.SHIFT);
        const shoot = this.input.isMouseDown(MouseBtn.Left);
        const scope = this.input.isMouseDown(MouseBtn.Right);

        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const input = entity.getComponent(Comp.PlayerInput);

            input.movey = 0;
            input.movey -= forward ? 1 : 0;
            input.movey += backward ? 1 : 0;

            input.movex = 0;
            input.movex -= left ? 1 : 0;
            input.movex += right ? 1 : 0;

            input.jump = jump;
            input.walk = walk;
            input.shoot = shoot;
            input.scope = scope;

            if (entity.hasComponent(Comp.Rotation2D)) {
                const str = input.scope ? 0.5 : 1;
                const rotation = entity.getComponent(Comp.Rotation2D);

                rotation.y -= lookHor * mouseSensitivity * str * dt;
                rotation.y = modulo(rotation.y, Math.PI * 2);

                rotation.x -= lookVer * mouseSensitivity * str * dt;
                rotation.x = clamp(rotation.x, -Math.PI / 2, Math.PI / 2);
            }
        }
    }
}