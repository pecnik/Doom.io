import {
    BoxGeometry,
    MeshBasicMaterial,
    Color,
    Object3D,
    PlaneGeometry,
    Vector3,
    EdgesGeometry,
    LineSegments,
    LineBasicMaterial,
    Geometry,
} from "three";
import { Editor } from "../Editor";
import { getNormalAxis } from "../../game/Helpers";

export interface Cursor3DParams {
    sampleDir: -1 | 1;
    color: Color;
    type?: "block" | "face";
}

export class Cursor3D extends Object3D {
    private readonly editor: Editor;
    private readonly mesh: LineSegments;
    private readonly isFace: boolean;

    public readonly color: Color;
    public readonly sampleDir: -1 | 1;

    public constructor(editor: Editor, params: Cursor3DParams) {
        super();
        this.editor = editor;
        this.color = params.color;
        this.sampleDir = params.sampleDir;
        this.isFace = params.type === "face";

        const geometry = this.createGeometry(params);
        const edges = new EdgesGeometry(geometry);
        const material = new LineBasicMaterial({ color: 0xffffff });
        this.mesh = new LineSegments(edges, material);

        this.add(this.mesh);
    }

    private createGeometry(params: Cursor3DParams): Geometry {
        const pad = 1 / 16;

        if (params.type === "face") {
            const geo = new PlaneGeometry(1, 1);
            geo.translate(0, 0, (1 - params.sampleDir * pad) / 2);
            return geo;
        }

        const size = 1 + pad * -params.sampleDir;
        return new BoxGeometry(size, size, size);
    }

    public update() {
        const rsp = this.editor.sampleBlock(this.sampleDir);
        if (rsp === undefined) {
            this.mesh.visible = false;
        } else {
            this.mesh.visible = true;
            this.mesh.position.copy(rsp.block.origin);
            if (this.isFace) {
                this.alightFace(rsp.normal);
            }
        }

        const material = this.mesh.material as MeshBasicMaterial;
        if (!material.color.equals(this.color)) {
            material.color.copy(this.color);
            material.needsUpdate = true;
        }

        return rsp;
    }

    private alightFace(normal: Vector3) {
        const axis = getNormalAxis(normal);
        const angle = (Math.PI / 2) * this.sampleDir;

        if (axis === "x") {
            this.mesh.rotation.x = 0;
            this.mesh.rotation.z = 0;
            this.mesh.rotation.y = angle * -normal.x;
            return;
        }

        if (axis === "y") {
            this.mesh.rotation.y = 0;
            this.mesh.rotation.z = 0;
            this.mesh.rotation.x = angle * normal.y;
            return;
        }

        if (axis === "z") {
            this.mesh.rotation.x = 0;
            this.mesh.rotation.z = 0;
            this.mesh.rotation.y = angle * normal.z + Math.PI / 2;
            return;
        }
    }
}
