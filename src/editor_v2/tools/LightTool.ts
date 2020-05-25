import { Tool, ToolType } from "./Tool";
import { KeyCode, MouseBtn } from "../../game/core/Input";
import { TransformControls } from "../utils/TransformControls";
import { Editor } from "../Editor";

export class LightTool extends Tool {
    public readonly name = "Light tool";
    public readonly type = ToolType.Light;
    public readonly hotkey = KeyCode.L;

    private readonly controls = new TransformControls(
        this.editor.camera,
        this.editor.renderer.domElement
    );

    public constructor(editor: Editor) {
        super(editor);
        this.editor.scene.add(this.controls);
    }

    public update() {
        if (this.input.isMousePresed(MouseBtn.Right)) {
            const [hit] = this.editor.hitscan();
            if (hit === undefined) return;

            console.log({ hit });

            // const { rgba } = this.editor.store.state.light;
            // const light = new LevelLight();
            // light.color.setRGB(rgba.r / 255, rgba.g / 255, rgba.b / 255);
            // light.position.copy(hit.point);
            // if (hit.face) {
            //     light.position.add(hit.face.normal);
            // }
            // this.editor.level.lights____.push(light);
            // this.editor.level.updateGeometry();

            // this.editor.level.debugLightsXXXXX.children.forEach((light) => {
            //     this.controls.attach(light);
            //     this.controls.update();
            // });
        }
    }
}
