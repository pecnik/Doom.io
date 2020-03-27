import { Tool } from "./Tool";
import { KeyCode } from "../../game/core/Input";
import { Intersection } from "three";
import { Hitscan } from "../../game/utils/EntityUtils";

export class TileTool extends Tool {
    public readonly title = "Tile tool";
    public readonly hotkey = KeyCode.TAB;

    public start() {
        this.hud.texture.visible = true;
        this.hud.texture.position.set(0, 0, -1);
    }

    public end() {
        this.hud.texture.visible = false;
        this.hud.cursor.position.setScalar(0);

        // Hitscan
        const buffer: Intersection[] = [];
        Hitscan.origin.set(0, 0);
        Hitscan.raycaster.setFromCamera(Hitscan.origin, this.hud.camera);
        Hitscan.raycaster.intersectObject(this.hud.texture, true, buffer);

        console.log({ buffer });
    }

    public update() {
        const { dx, dy } = this.input.mouse;
        this.hud.cursor.position.x += dx;
        this.hud.cursor.position.y -= dy;

        // A bit hacky ... prevents FPS mouse look, when this tool is active
        this.input.mouse.dx = 0;
        this.input.mouse.dy = 0;
    }
}