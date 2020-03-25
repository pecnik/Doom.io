import { Scene, Vector3 } from "three";

export class Voxel {
    public readonly origin = new Vector3();
}

export class Level {
    public readonly width: number;
    public readonly depth: number;
    public readonly height: number;

    public readonly scene = new Scene();
    public readonly cells: Voxel[][][] = [];

    public constructor(width: number, depth: number, height: number) {
        this.width = width;
        this.depth = depth;
        this.height = height;

        for (let x = 0; x < this.height; x++) {
            this.cells[x] = [];
            for (let y = 0; y < this.depth; y++) {
                this.cells[x][y] = [];
                for (let z = 0; z < this.width; z++) {
                    const voxel = new Voxel();
                    voxel.origin.set(z, x, y);
                    this.cells[x][y][z] = voxel;
                }
            }
        }
    }
}
