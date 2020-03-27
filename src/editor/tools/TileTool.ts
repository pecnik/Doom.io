import { Tool } from "./Tool";
import { KeyCode } from "../../game/core/Input";

export class TileTool extends Tool {
    public readonly title = "Tile tool";
    public readonly hotkey = KeyCode.TAB;

    public end() {
        this.hud.cursor.position.setScalar(0);
    }

    public update() {
        const { dx, dy } = this.input.mouse;
        this.input.mouse.dx = 0;
        this.input.mouse.dy = 0;
        this.hud.cursor.position.x += dx;
        this.hud.cursor.position.y -= dy;
    }
}