import { Editor, EditorTool } from "./Editor";
import { KeyCode } from "../game/core/Input";
import { Raycaster, Intersection, Vector2 } from "three";
import { VoxelType } from "./Level";

export abstract class Tool {
    protected readonly editor: Editor;
    protected readonly raycaster: Raycaster;

    public abstract readonly guid: EditorTool;
    public abstract readonly hotkey: KeyCode;

    public constructor(editor: Editor) {
        this.editor = editor;
        this.raycaster = new Raycaster();
    }

    public onMouseOne() {}
    public onMouseTwo() {}

    protected sampleVoxel(dir: -1 | 1) {
        const buffer: Intersection[] = [];
        const origin = new Vector2();
        this.raycaster.setFromCamera(origin, this.editor.camera);
        this.raycaster.intersectObject(this.editor.floor, true, buffer);
        this.raycaster.intersectObject(this.editor.level.mesh, true, buffer);

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

export class BlockTool extends Tool {
    public readonly guid = EditorTool.Block;
    public readonly hotkey = KeyCode.E;

    public onMouseOne() {
        const tileId = this.editor.getSelectedTileId();
        const rsp = this.sampleVoxel(1);
        if (rsp !== undefined) {
            rsp.voxel.type = VoxelType.Solid;
            rsp.voxel.faces.fill(tileId);
            console.log({ tileId });
            this.editor.level.updateGeometry();
        }
    }

    public onMouseTwo() {
        const rsp = this.sampleVoxel(-1);
        if (rsp !== undefined) {
            rsp.voxel.type = VoxelType.Empty;
            this.editor.level.updateGeometry();
        }
    }
}
