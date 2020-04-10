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

export class PaintTool extends Tool {
    public readonly guid = EditorTool.Paint;
    public readonly hotkey = KeyCode.F;

    public onMouseOne() {
        const tileId = this.editor.getSelectedTileId();
        const rsp = this.sampleVoxel(-1);
        if (rsp !== undefined) {
            let face = -1;
            if (rsp.normal.x === -1) face = 0;
            if (rsp.normal.x === +1) face = 1;
            if (rsp.normal.y === -1) face = 2;
            if (rsp.normal.y === +1) face = 3;
            if (rsp.normal.z === -1) face = 4;
            if (rsp.normal.z === +1) face = 5;

            if (face > -1) {
                rsp.voxel.faces[face] = tileId;
                this.editor.level.updateGeometry();
            }
        }
    }

    public onMouseTwo() {
        const tileId = this.editor.getSelectedTileId();
        const rsp = this.sampleVoxel(-1);
        if (rsp !== undefined) {
            rsp.voxel.faces.fill(tileId);
            this.editor.level.updateGeometry();
        }
    }
}

export class SampleTool extends Tool {
    public readonly guid = EditorTool.Sample;
    public readonly hotkey = KeyCode.ALT;

    public onMouseOne() {
        const rsp = this.sampleVoxel(-1);
        if (rsp !== undefined) {
            let face = -1;
            if (rsp.normal.x === -1) face = 0;
            if (rsp.normal.x === +1) face = 1;
            if (rsp.normal.y === -1) face = 2;
            if (rsp.normal.y === +1) face = 3;
            if (rsp.normal.z === -1) face = 4;
            if (rsp.normal.z === +1) face = 5;

            if (face > -1) {
                const tileId = rsp.voxel.faces[face];
                const { texture } = this.editor.store.state;
                texture.slots[texture.index] = tileId;
                texture.slots = [...texture.slots]; // Force vue update
            }
        }
    }

    public onMouseTwo() {
        const tileId = this.editor.getSelectedTileId();
        const rsp = this.sampleVoxel(-1);
        if (rsp !== undefined) {
            rsp.voxel.faces.fill(tileId);
            this.editor.level.updateGeometry();
        }
    }
}
