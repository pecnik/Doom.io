import { Editor } from "../Editor";
import { KeyCode } from "../../game/core/Input";
import { Raycaster, Intersection, Vector2 } from "three";

export enum Tool_ID {
    Block = "Block",
    Paint = "Paint",
    Sample = "Sample"
}

export abstract class Tool {
    protected readonly editor: Editor;
    protected readonly raycaster: Raycaster;

    public abstract readonly id: Tool_ID;
    public abstract readonly hotkey: KeyCode;

    public constructor(editor: Editor) {
        this.editor = editor;
        this.raycaster = new Raycaster();
    }

    public onLoad() {}
    public onStart() {}
    public onUpdate() {}
    public onLeftPressed() {}
    public onLeftReleased() {}
    public onRightPressed() {}
    public onRightReleased() {}

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
