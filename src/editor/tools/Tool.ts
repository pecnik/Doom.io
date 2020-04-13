import { Editor } from "../Editor";
import { Raycaster, Intersection, Vector2 } from "three";
import { KeyCode } from "../../game/core/Input";

export abstract class Tool {
    public abstract name: string;
    public abstract key: KeyCode;

    public preload() {}
    public start() {}
    public end() {}

    public onMousePressed() {}
    public onMouseMove() {}
    public onMouseReleased() {}

    public onRightMousePressed() {}
    public onRightMouseMove() {}
    public onRightMouseReleased() {}

    protected readonly editor: Editor;
    protected readonly raycaster: Raycaster;

    public constructor(editor: Editor) {
        this.editor = editor;
        this.raycaster = new Raycaster();
    }

    protected sampleVoxel(dir: -1 | 1) {
        const buffer: Intersection[] = [];
        const origin = new Vector2();
        this.raycaster.setFromCamera(origin, this.editor.camera);
        this.raycaster.intersectObject(this.editor.level.mesh, true, buffer);
        this.raycaster.intersectObject(this.editor.floor, true, buffer);

        const [hit] = buffer;
        if (!hit) return;
        if (!hit.face) return;

        const point = hit.point.clone();
        const normal = hit.face.normal.clone().multiplyScalar(0.5 * dir);
        point.add(normal);

        const voxel = this.editor.level.getVoxelAt(point);
        if (voxel === undefined) return;
        return {
            point: point.clone(),
            normal: hit.face.normal.clone(),
            voxel
        };
    }
}
