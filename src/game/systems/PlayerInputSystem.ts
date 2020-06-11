import { System } from "../ecs";
import { clamp } from "lodash";
import { Components } from "../ecs";
import { KeyCode, MouseBtn } from "../core/Input";
import { modulo } from "../core/Utils";
import { LocalAvatarArchetype } from "../ecs/Archetypes";
import { WeaponType, WEAPON_SPEC_RECORD } from "../data/Weapon";
import { Settings } from "../../settings/Settings";
import { GameClient } from "../GameClient";

const MOUSE_SENSITIVITY = Settings.input.mouseSensitivity * 0.25;

export class PlayerInputSystem extends System<GameClient> {
    private readonly input = this.game.input;
    private readonly family = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    public update(dt: number) {
        // Look input
        const lookHor = this.input.mouse.dx;
        const lookVer = this.input.mouse.dy;

        // Move
        const forward = this.input.isKeyDown(KeyCode.W);
        const backward = this.input.isKeyDown(KeyCode.S);
        const left = this.input.isKeyDown(KeyCode.A);
        const right = this.input.isKeyDown(KeyCode.D);
        const jump = this.input.isKeyPressed(KeyCode.SPACE);
        const dash = this.input.isKeyPressed(KeyCode.SHIFT);
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
            input.dash = dash;
            input.shoot = shoot;
            input.scope = scope;
            input.reloadQueue = input.reloadQueue || reload;
            input.weaponType = this.getWeaponType(input);

            if (rotation !== undefined) {
                const str = input.scope ? 0.5 : 1;

                rotation.y -= lookHor * MOUSE_SENSITIVITY * str * dt;
                rotation.y = modulo(rotation.y, Math.PI * 2);

                rotation.x -= lookVer * MOUSE_SENSITIVITY * str * dt;
                rotation.x = clamp(rotation.x, -Math.PI / 2, Math.PI / 2);
            }
        });
    }

    private getWeaponType(input: Components.Input): WeaponType {
        if (this.input.isKeyDown(KeyCode.NUM_1)) return WeaponType.Pistol;
        if (this.input.isKeyDown(KeyCode.NUM_2)) return WeaponType.Shotgun;
        if (this.input.isKeyDown(KeyCode.NUM_3)) return WeaponType.Machinegun;
        if (this.input.isKeyDown(KeyCode.NUM_4)) return WeaponType.Plasma;

        const scroll = this.input.mouse.scroll;
        if (scroll === 0) {
            return input.weaponType;
        }

        // TODO: fix me
        const weaponSpec = WEAPON_SPEC_RECORD[input.weaponType];
        const weaponSpecs = Object.values(WEAPON_SPEC_RECORD);

        let index = weaponSpecs.indexOf(weaponSpec);
        index += scroll > 0 ? 1 : -1;
        index = modulo(index, weaponSpecs.length);
        return weaponSpecs[index].type;
    }
}
