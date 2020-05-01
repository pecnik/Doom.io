import { System } from "../ecs";
import { clamp } from "lodash";
import { World } from "../ecs";
import { Components } from "../ecs";
import { Input, KeyCode, MouseBtn } from "../core/Input";
import { modulo } from "../core/Utils";
import { WeaponSpecs } from "../data/Types";
import { LocalAvatarArchetype } from "../ecs/Archetypes";

export class PlayerInputSystem extends System {
    private readonly input: Input;
    private readonly family = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    public constructor(world: World, input: Input) {
        super(world);
        this.input = input;
    }

    public update(dt: number) {
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
        const reload = this.input.isKeyDown(KeyCode.R);

        this.family.entities.forEach((entity) => {
            const { input, rotation } = entity;

            input.movey = 0;
            input.movey -= forward ? 1 : 0;
            input.movey += backward ? 1 : 0;

            input.movex = 0;
            input.movex -= left ? 1 : 0;
            input.movex += right ? 1 : 0;

            input.jump = jump;
            input.crouch = walk;
            input.shoot = shoot;
            input.scope = scope;
            input.reload = reload;
            input.weaponIndex = this.getWeaponIndex(input);

            if (rotation !== undefined) {
                const str = input.scope ? 0.5 : 1;

                rotation.y -= lookHor * mouseSensitivity * str * dt;
                rotation.y = modulo(rotation.y, Math.PI * 2);

                rotation.x -= lookVer * mouseSensitivity * str * dt;
                rotation.x = clamp(rotation.x, -Math.PI / 2, Math.PI / 2);
            }
        });
    }

    private getWeaponIndex(input: Components.Input) {
        if (this.input.isKeyDown(KeyCode.NUM_1)) return 0;
        if (this.input.isKeyDown(KeyCode.NUM_2)) return 1;
        if (this.input.isKeyDown(KeyCode.NUM_3)) return 2;

        const scroll = this.input.mouse.scroll;
        if (scroll === 0) {
            return input.weaponIndex;
        }

        const weaponIndex = input.weaponIndex + (scroll > 0 ? 1 : -1);
        return modulo(weaponIndex, WeaponSpecs.length);
    }
}
