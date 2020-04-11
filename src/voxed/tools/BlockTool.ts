import { Tool_ID } from "../Editor";
import { KeyCode } from "../../game/core/Input";
import { MeshBasicMaterial, Color } from "three";
import { VoxelType, Level } from "../Level";
import { disposeMeshMaterial } from "../../game/utils/Helpers";
import { Tool } from "./Tools";

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
