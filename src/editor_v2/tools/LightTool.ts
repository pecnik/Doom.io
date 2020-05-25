import { Tool, ToolType } from "./Tool";
import { KeyCode, MouseBtn } from "../../game/core/Input";
import { TransformControls } from "../utils/TransformControls";
import { Editor } from "../Editor";
import {
    Group,
    BoxGeometry,
    MeshBasicMaterial,
    Mesh,
    Intersection,
} from "three";

class LightMesh extends Mesh {
    private static readonly geometry = new BoxGeometry(0.5, 0.5, 0.5);
    public readonly material: MeshBasicMaterial;
    public constructor() {
        const material = new MeshBasicMaterial();
        super(LightMesh.geometry, material);
        this.material = material;
    }
}

export class LightTool extends Tool {
    public readonly name = "Light tool";
    public readonly type = ToolType.Light;
    public readonly hotkey = KeyCode.L;

    private readonly lights = new Group();
    private readonly controls = new TransformControls(
        this.editor.camera,
        this.editor.renderer.domElement
    );

    public constructor(editor: Editor) {
        super(editor);
        this.editor.scene.add(this.lights, this.controls);
    }

    public update() {
        if (this.input.isMousePresed(MouseBtn.Right)) {
            const [hit] = this.editor.hitscan();
            if (hit !== undefined) {
                const light = this.createLight(hit);
                this.controls.attach(light);
                this.controls.update();
            }
        }

        if (this.input.isMousePresed(MouseBtn.Left)) {
            const [hit] = this.editor.hitscan(this.lights);
            if (hit !== undefined && hit.object instanceof LightMesh) {
                this.controls.attach(hit.object);
                this.controls.update();
            }
        }
    }

    private createLight(hit: Intersection) {
        const { rgba } = this.editor.store.state.light;
        const light = new LightMesh();
        light.material.color.setRGB(rgba.r / 255, rgba.g / 255, rgba.b / 255);
        light.position.copy(hit.point);
        if (hit.face) {
            light.position.add(hit.face.normal);
        }
        this.lights.add(light);
        return light;
    }
}
