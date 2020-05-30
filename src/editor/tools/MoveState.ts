import { ToolState } from "./ToolState";
import { OrbitControls } from "../utils/OrbitControls";

export class MoveState extends ToolState {
    private readonly controls = new OrbitControls(
        this.editor.camera,
        this.editor.renderer.domElement
    );

    public readonly cursorType = "cursor-tool-move";

    public endMove() {
        this.editor.setToolStateDefault();
    }

    public initialize() {
        this.controls.enabled = false;
    }

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

    public update() {
        this.controls.update();
    }
}
