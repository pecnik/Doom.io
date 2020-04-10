import { Mesh } from "three";

export class VoxelData {
    public index = 0;
    public x = 0;
    public y = 0;
    public z = 0;
}

export class LevelData {
    public voxel = new Array<VoxelData>();
    public max_x = 0;
    public max_y = 0;
    public max_z = 0;
}

export class Level {
    public mesh = new Mesh();
    public data = new LevelData();

    public initData(max_x: number, max_y: number, max_z: number) {
        this.data.max_x = max_x;
        this.data.max_y = max_y;
        this.data.max_z = max_z;
        this.data.voxel = new Array<VoxelData>(max_x * max_y * max_z);
        for (let x = 0; x < max_x; x++) {
            for (let y = 0; y < max_y; y++) {
                for (let z = 0; z < max_z; z++) {
                    const index = x + y * max_x + z * max_x * max_y;
                    const voxel: VoxelData = {
                        index,
                        x: index % max_x,
                        y: (index / max_x) % max_y,
                        z: index / (max_x * max_y)
                    };
                    this.data.voxel[index] = voxel;
                }
            }
        }
    }
}
