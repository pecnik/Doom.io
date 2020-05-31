import { KeyCode } from "../../game/core/Input";
import { OrbitControls } from "../utils/OrbitControls";
import { Tool } from "./Tool";

export class MoveTool extends Tool {
    public readonly name = "Move tool";
    public readonly hotkey = KeyCode.M;
    public readonly cursorType = "tool-cursor-move";
    private readonly controls = new OrbitControls(
        this.editor.camera,
        this.editor.renderer.domElement
    );

    public start() {
        this.controls.enabled = true;
        this.controls.minPolarAngle = 0;
        this.controls.maxPolarAngle = Math.PI;
        this.controls.minDistance = 0;
        this.controls.maxDistance = 128;
        this.controls.enablePan = true;
        this.controls.enableZoom = true;
        this.controls.zoomSpeed = 1.5;
    }

    public end() {
        this.controls.enabled = false;
    }
}
