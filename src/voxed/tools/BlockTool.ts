import { KeyCode } from "../../game/core/Input";
import { MeshBasicMaterial, Color, Vector3 } from "three";
import { VoxelType, Level } from "../Level";
import { disposeMeshMaterial } from "../../game/utils/Helpers";
import { Tool, Tool_ID } from "./Tool";

enum Mode {
    Idle,
    Draw,
    Erase
}

export class BlockTool extends Tool {
    public readonly id = Tool_ID.Block;
    public readonly hotkey = KeyCode.E;
    public readonly faicon = "fa-cube";

    private readonly previewLevel = new Level();
    private readonly state = {
        mode: Mode.Idle,
        tileId: 0,
        begin: new Vector3(),
        end: new Vector3()
    };

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

    public onLeftPressed() {
        if (this.state.mode === Mode.Erase) {
            this.state.mode = Mode.Idle;
            return;
        }

        const rsp = this.sampleVoxel(1);
        if (rsp === undefined) {
            return;
        }

        // Init leve
        const { max_x, max_y, max_z } = this.editor.level.data;
        this.previewLevel.mesh.visible = true;
        this.previewLevel.setSize(max_x, max_y, max_z);
        this.previewLevel.updateGeometry();

        // Set origin
        const { x, y, z } = rsp.voxel;
        this.state.mode = Mode.Draw;
        this.state.tileId = this.editor.getSelectedTileId();
        this.state.begin.set(x, y, z);
        this.state.end.set(x, y, z);
        this.updatePreview();
    }

    public onRightPressed() {
        if (this.state.mode === Mode.Draw) {
            this.state.mode = Mode.Idle;
            return;
        }

        const rsp = this.sampleVoxel(-1);
        if (rsp === undefined) {
            return;
        }

        // Init leve
        const { max_x, max_y, max_z } = this.editor.level.data;
        this.previewLevel.mesh.visible = true;
        this.previewLevel.setSize(max_x, max_y, max_z);
        this.previewLevel.updateGeometry();

        // Set origin
        const { x, y, z } = rsp.voxel;
        this.state.mode = Mode.Erase;
        this.state.tileId = this.editor.getSelectedTileId();
        this.state.begin.set(x, y, z);
        this.state.end.set(x, y, z);
        this.updatePreview();
    }

    public onUpdate() {
        this.previewLevel.mesh.visible = this.state.mode !== Mode.Idle;
        if (!this.previewLevel.mesh.visible) {
            return;
        }

        const rsp = this.sampleVoxel(this.state.mode === Mode.Draw ? 1 : -1);
        if (rsp === undefined) {
            return;
        }

        const { x, y, z } = rsp.voxel;
        this.state.end.set(x, y, z);
        this.updatePreview();
    }

    public onLeftReleased() {
        if (this.state.mode === Mode.Draw) {
            this.state.mode = Mode.Idle;
            this.previewLevel.data.voxel.forEach(voxel => {
                if (voxel.type === VoxelType.Solid) {
                    this.editor.level.data.voxel[voxel.index] = voxel;
                }
            });
            this.editor.level.updateGeometry();
        }
    }

    public onRightReleased() {
        if (this.state.mode === Mode.Erase) {
            this.state.mode = Mode.Idle;
            this.previewLevel.data.voxel.forEach(voxel => {
                if (voxel.type === VoxelType.Solid) {
                    const evoxel = this.editor.level.data.voxel[voxel.index];
                    evoxel.type = VoxelType.Empty;
                }
            });
            this.editor.level.updateGeometry();
        }
    }

    private updatePreview() {
        const { begin, end } = this.state;
        const min_x = Math.min(begin.x, end.x);
        const max_x = Math.max(begin.x, end.x);
        const min_y = Math.min(begin.y, end.y);
        const max_y = Math.max(begin.y, end.y);
        const min_z = Math.min(begin.z, end.z);
        const max_z = Math.max(begin.z, end.z);

        this.previewLevel.data.voxel.forEach(voxel => {
            voxel.type = VoxelType.Empty;
            if (voxel.x < min_x || voxel.x > max_x) return;
            if (voxel.y < min_y || voxel.y > max_y) return;
            if (voxel.z < min_z || voxel.z > max_z) return;

            voxel.type = VoxelType.Solid;
            voxel.faces.fill(this.state.tileId);
        });

        this.previewLevel.updateGeometry();
    }
}
