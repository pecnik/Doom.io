import { Mesh, BoxGeometry, MeshBasicMaterial, Color, Object3D } from "three";
import { Editor } from "../Editor";

export interface Cursor3DParams {
    sampleDir: -1 | 1;
    color: Color;
}

export class Cursor3D extends Object3D {
    private readonly editor: Editor;
    private readonly mesh: Mesh;

    public readonly color: Color;
    public readonly sampleDir: -1 | 1;

    public constructor(editor: Editor, params: Cursor3DParams) {
        super();
        const size = 1.01;
        this.editor = editor;
        this.color = params.color;
        this.sampleDir = params.sampleDir;
        this.mesh = new Mesh(
            new BoxGeometry(size, size, size),
            new MeshBasicMaterial({ color: params.color, wireframe: true })
        );
        this.add(this.mesh);
    }

    public update() {
        const rsp = this.editor.sampleBlock(this.sampleDir);
        if (rsp === undefined) {
            this.mesh.visible = false;
        } else {
            this.mesh.visible = true;
            this.mesh.position.copy(rsp.block.origin);
        }

        const material = this.mesh.material as MeshBasicMaterial;
        if (!material.color.equals(this.color)) {
            material.color.copy(this.color);
            material.needsUpdate = true;
        }

        return rsp;
    }
}
