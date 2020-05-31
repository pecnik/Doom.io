import { Mesh, BoxGeometry, MeshBasicMaterial, Color, Object3D } from "three";
import { Editor } from "../Editor";
export class Cursor3D extends Object3D {
    private readonly editor: Editor;
    private readonly mesh: Mesh;
    public readonly color: Color;
    public sampleDir: -1 | 1 = 1;
    public constructor(editor: Editor, color = new Color(1, 1, 1)) {
        super();
        this.editor = editor;
        this.color = color;
        this.mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color, wireframe: true }));
        this.add(this.mesh);
    }
    public update() {
        const rsp = this.editor.sampleBlock(this.sampleDir);
        if (rsp === undefined) {
            this.mesh.visible = false;
        }
        else {
            this.mesh.visible = true;
            this.mesh.position.copy(rsp.block.origin);
        }
        return rsp;
    }
}
