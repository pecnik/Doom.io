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
import { debounce } from "lodash";

class LightMesh extends Mesh {
    private static readonly geometry = new BoxGeometry(0.5, 0.5, 0.5);
    public readonly material: MeshBasicMaterial;
    public constructor() {
        const material = new MeshBasicMaterial({ transparent: true });
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

    private readonly queueShadingUpdate = debounce(() => {
        if (this.editor.getActiveTool() !== this) {
            return;
        }

        const lights = this.lights.children.map((obj) => {
            const mesh = obj as LightMesh;
            return {
                position: mesh.position,
                color: mesh.material.color,
            };
        });
        this.editor.level.lights.length = 0;
        this.editor.level.lights.push(...lights);
        this.editor.level.updateGeometryShading(lights);
        this.editor.commitChange();
    }, 250);

    public constructor(editor: Editor) {
        super(editor);
        this.controls.addEventListener("objectChange", this.queueShadingUpdate);
        this.editor.scene.add(this.lights, this.controls);
        this.editor.store.watch(
            (state) => state.light.rgba,
            (rgba) => {
                const light = this.controls.object as LightMesh;
                if (light !== undefined) {
                    this.queueShadingUpdate();
                    light.material.color.setRGB(
                        rgba.r / 255,
                        rgba.g / 255,
                        rgba.b / 255
                    );
                }
            }
        );
    }

    public start() {
        this.controls.visible = true;
        this.queueShadingUpdate();
        this.updatePreview();
    }

    public end(prevTool: ToolType) {
        if (prevTool !== ToolType.Move) {
            this.editor.level.updateGeometry();
        }

        this.controls.visible = false;
        this.lights.children.forEach((obj) => {
            const light = obj as LightMesh;
            light.material.opacity = 0.25;
            light.material.needsUpdate = true;
        });
    }

    public update() {
        // Add light
        if (this.input.isMousePresed(MouseBtn.Right)) {
            const [hit] = this.editor.hitscan();
            if (hit !== undefined) {
                const light = this.createLight(hit);
                this.controls.attach(light);
                this.controls.update();
                this.queueShadingUpdate();
            }
        }

        // Select light
        if (this.input.isMousePresed(MouseBtn.Left)) {
            const [hit] = this.editor.hitscan(this.lights);
            if (hit !== undefined && hit.object instanceof LightMesh) {
                this.controls.attach(hit.object);
                this.controls.update();

                const light = hit.object as LightMesh;
                const { rgba } = this.editor.store.state.light;
                rgba.r = Math.floor(light.material.color.r * 255);
                rgba.g = Math.floor(light.material.color.g * 255);
                rgba.b = Math.floor(light.material.color.b * 255);
                rgba.a = 1;
            }
        }

        // Delete light
        if (this.input.isKeyPressed(KeyCode.DEL)) {
            if (this.controls.object !== undefined) {
                this.lights.remove(this.controls.object);
                this.controls.detach();
                this.controls.update();
                this.queueShadingUpdate();
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

    private updatePreview() {
        let count = 0;
        this.editor.level.lights.forEach((light) => {
            let lightMesh = this.lights.children[count] as
                | LightMesh
                | undefined;
            if (lightMesh === undefined) {
                lightMesh = new LightMesh();
                this.lights.add(lightMesh);
            }

            lightMesh.visible = true;
            lightMesh.position.copy(light.position);
            lightMesh.material.color.copy(light.color);
            lightMesh.material.opacity = 1;
            count++;
        });

        // Hide remaining bounces
        for (let i = count; i < this.lights.children.length; i++) {
            this.lights.children[i].visible = false;
        }
    }
}
