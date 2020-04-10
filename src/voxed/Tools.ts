import { Editor, Tool_ID } from "./Editor";
import { KeyCode } from "../game/core/Input";
import {
    Raycaster,
    Intersection,
    Vector2,
    MeshBasicMaterial,
    Color
} from "three";
import { VoxelType, Level } from "./Level";
import { disposeMeshMaterial } from "../game/utils/Helpers";

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
    public onMouseDown() {}
    public onMouseUp() {}
    public onMouseTwoDown() {}
    public onMouseTwoUp() {}

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

export class BlockTool extends Tool {
    private readonly previewLevel = new Level();
    private drawing = false;

    public readonly id = Tool_ID.Block;
    public readonly hotkey = KeyCode.E;

    public onLoad() {
        let material = this.editor.level.mesh.material as MeshBasicMaterial;
        material = material.clone();
        material.transparent = true;
        material.opacity = 0.75;
        material.color = new Color(0x00ffff);

        disposeMeshMaterial(this.previewLevel.mesh.material);
        this.previewLevel.mesh.material = material;

        this.editor.scene.add(this.previewLevel.mesh);
    }

    public onUpdate() {
        this.previewLevel.mesh.visible = this.drawing;

        if (this.drawing) {
            const rsp = this.sampleVoxel(1);
            if (rsp !== undefined) {
                const voxel = this.previewLevel.data.voxel[rsp.voxel.index];
                if (voxel.type !== VoxelType.Solid) {
                    const tileId = this.editor.getSelectedTileId();
                    voxel.type = VoxelType.Solid;
                    voxel.faces.fill(tileId);
                    this.previewLevel.updateGeometry();
                }
            }
        }
    }

    public onMouseDown() {
        this.drawing = true;
        this.previewLevel.mesh.visible = true;
        this.previewLevel.setSize(
            this.editor.level.data.max_x,
            this.editor.level.data.max_y,
            this.editor.level.data.max_z
        );
        this.previewLevel.updateGeometry();
    }

    public onMouseUp() {
        if (this.drawing) {
            this.drawing = false;
            this.previewLevel.data.voxel.forEach(voxel => {
                if (voxel.type === VoxelType.Solid) {
                    this.editor.level.data.voxel[voxel.index] = voxel;
                }
            });
            this.editor.level.updateGeometry();
        }
    }

    public onMouseTwoDown() {
        if (this.drawing) {
            this.drawing = false;
        } else {
            const rsp = this.sampleVoxel(-1);
            if (rsp !== undefined) {
                rsp.voxel.type = VoxelType.Empty;
                this.editor.level.updateGeometry();
            }
        }
    }
}

export class PaintTool extends Tool {
    public readonly id = Tool_ID.Paint;
    public readonly hotkey = KeyCode.F;

    public onMouseDown() {
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

    public onMouseTwoDown() {
        const tileId = this.editor.getSelectedTileId();
        const rsp = this.sampleVoxel(-1);
        if (rsp !== undefined) {
            rsp.voxel.faces.fill(tileId);
            this.editor.level.updateGeometry();
        }
    }
}

export class SampleTool extends Tool {
    private prevTool = Tool_ID.Block;

    public readonly id = Tool_ID.Sample;
    public readonly hotkey = KeyCode.ALT;

    public onStart() {
        this.prevTool = this.editor.getSelectedToolId();
    }

    public onMouseDown() {
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
                this.editor.setActiveTool(this.prevTool);
            }
        }
    }

    public onMouseTwoDown() {
        const tileId = this.editor.getSelectedTileId();
        const rsp = this.sampleVoxel(-1);
        if (rsp !== undefined) {
            rsp.voxel.faces.fill(tileId);
            this.editor.level.updateGeometry();
        }
    }
}
