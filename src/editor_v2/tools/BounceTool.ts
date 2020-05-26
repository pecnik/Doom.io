import { Tool, ToolType } from "./Tool";
import { KeyCode, MouseBtn } from "../../game/core/Input";
import { Editor } from "../Editor";
import {
    Scene,
    MeshBasicMaterial,
    CylinderGeometry,
    Mesh,
    BoxGeometry,
    Group,
} from "three";

const bounceGep = new CylinderGeometry(0.25, 0.25, 1, 8, 1, true);
bounceGep.translate(0, 0.5, 0);

const bounceMat = new MeshBasicMaterial({
    color: 0x00aaaa,
});

export class BounceTool extends Tool {
    public readonly name = "Bounce tool";
    public readonly type = ToolType.Bounce;
    public readonly hotkey = KeyCode.B;

    private readonly scene = new Scene();
    private readonly bounces = new Group();
    private readonly highlight = new Mesh(
        new BoxGeometry(1, 1, 1),
        new MeshBasicMaterial({ wireframe: true, color: 0xffff00 })
    );

    public constructor(editor: Editor) {
        super(editor);
        this.scene.add(this.highlight, this.bounces);
        this.editor.scene.add(this.scene);

        this.editor.store.watch(
            (state) => state.bounce.blockIndex,
            (blockIndex) => {
                const block = this.editor.level.blocks[blockIndex];
                if (block === undefined) {
                    this.highlight.visible = false;
                } else {
                    this.highlight.visible = true;
                    this.highlight.position.copy(block.origin);
                    this.editor.store.state.bounce.bounceValue = block.bounce;
                }
            }
        );

        this.editor.store.watch(
            (state) => state.bounce.bounceValue,
            (value) => {
                const { blockIndex } = this.editor.store.state.bounce;
                const block = this.editor.level.blocks[blockIndex];
                if (block !== undefined) {
                    block.bounce = value;
                    this.updatePreview();
                    this.editor.commitChange();
                }
            }
        );
    }

    public start() {
        this.highlight.visible = false;
        this.updatePreview();
    }

    public end() {
        this.highlight.visible = true;
    }

    public update() {
        if (this.input.isMousePresed(MouseBtn.Left)) {
            const rsp = this.editor.sampleBlock(1);
            if (rsp !== undefined) {
                this.editor.store.state.bounce.blockIndex = rsp.block.index;
            }
        }
    }

    private updatePreview() {
        let count = 0;
        this.editor.level.blocks.forEach((block) => {
            if (block.bounce === 0) return;

            let bounce = this.bounces.children[count];
            if (bounce === undefined) {
                bounce = new Mesh(bounceGep, bounceMat);
                this.bounces.add(bounce);
            }

            bounce.position.copy(block.origin);
            bounce.position.y -= 0.5;
            bounce.scale.y = block.bounce;
            bounce.visible = true;
            count++;
        });

        // Hide remaining bounces
        for (let i = count; i < this.bounces.children.length; i++) {
            this.bounces.children[i].visible = false;
        }
    }
}
