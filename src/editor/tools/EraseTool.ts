import { Tool } from "./Tool";
import { VoxelType, Level } from "../../game/data/Level";
import { Vector3, Color, MeshBasicMaterial } from "three";
import { disposeMeshMaterial } from "../../game/utils/Helpers";
import { store } from "../Store";

export class EraseTool extends Tool {
    public readonly name = "erase";

    private readonly previewLevel = new Level();
    private readonly state = {
        tileId: 0,
        active: false,
        begin: new Vector3(),
        end: new Vector3()
    };

    public preload() {
        let material = this.editor.level.mesh.material as MeshBasicMaterial;
        material = material.clone();
        material.transparent = true;
        material.opacity = 0.75;
        material.color = new Color(0xff0000);

        disposeMeshMaterial(this.previewLevel.mesh.material);
        this.previewLevel.mesh.material = material;
        this.editor.scene.add(this.previewLevel.mesh);
    }

    public update() {
        this.previewLevel.mesh.visible = this.state.active;

        if (this.state.active) {
            const rsp = this.sampleVoxel(-1);
            if (rsp === undefined) {
                return;
            }

            const { x, y, z } = rsp.voxel;
            this.state.end.set(x, y, z);
            this.updatePreview();
        }
    }

    public onMousePressed() {
        const rsp = this.sampleVoxel(-1);
        if (rsp === undefined) {
            return;
        }

        // Set to active
        this.state.active = true;
        this.state.tileId = store.getters.tileId;

        // Init leve
        const { max_x, max_y, max_z } = this.editor.level.data;
        this.previewLevel.mesh.visible = true;
        this.previewLevel.setSize(max_x, max_y, max_z);
        this.previewLevel.updateGeometry();

        // Set origin
        const { x, y, z } = rsp.voxel;
        this.state.begin.set(x, y, z);
        this.state.end.set(x, y, z);
        this.updatePreview();
    }

    public onMouseReleased() {
        this.state.active = false;
        this.previewLevel.data.voxel.forEach(voxel => {
            if (voxel.type === VoxelType.Block) {
                const voxel2 = this.editor.level.data.voxel[voxel.index];
                voxel2.type = VoxelType.Empty;
            }
        });
        this.editor.level.updateGeometry();
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

            voxel.type = VoxelType.Block;
            voxel.faces.fill(this.state.tileId);
        });

        this.previewLevel.updateGeometry();
    }
}
