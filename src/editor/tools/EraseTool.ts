import { Tool } from "./Tool";
import { VoxelType, Level } from "../../game/data/Level";
import { Vector3, Color, MeshBasicMaterial } from "three";
import { disposeMeshMaterial } from "../../game/utils/Helpers";
import { store } from "../Store";
import { KeyCode } from "../../game/core/Input";

export class EraseTool extends Tool {
    public readonly name = "erase";
    public readonly key = KeyCode.E;

    private readonly previewLevel = new Level();
    private readonly state = {
        tileId: 0,
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

    public onMousePressed() {
        // Init preview leve
        const { max_x, max_y, max_z } = this.editor.level.data;
        this.previewLevel.mesh.visible = true;
        this.previewLevel.setSize(max_x, max_y, max_z);
        this.previewLevel.updateGeometry();

        // Set store active tile
        this.state.tileId = store.getters.tileId;

        // Set origin
        const rsp = this.sampleVoxel(-1);
        if (rsp !== undefined) {
            const { x, y, z } = rsp.voxel;
            this.state.begin.set(x, y, z);
            this.updatePreview();
        }
    }

    public onMouseMove() {
        const rsp = this.sampleVoxel(-1);
        if (rsp === undefined) {
            return;
        }

        const { x, y, z } = rsp.voxel;
        if (
            this.state.end.x !== x ||
            this.state.end.y !== y ||
            this.state.end.z !== z
        ) {
            this.state.end.set(x, y, z);
            this.updatePreview();
        }
    }

    public onMouseReleased() {
        const { level } = this.editor;
        this.previewLevel.mesh.visible = false;
        this.previewLevel.data.voxel.forEach(voxel => {
            if (voxel.type === VoxelType.Block) {
                level.data.voxel[voxel.index].type = VoxelType.Empty;
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
