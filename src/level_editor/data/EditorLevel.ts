import { Scene, Vector3, Texture } from "three";

export class Voxel {
    public readonly origin = new Vector3();
    public readonly faces = [0, 0, 0, 0, 0, 0];
    public solid = false;
    public light = false;
}

export class EditorLevel {
    public readonly scene: Scene = new Scene();
    public readonly voxel: Voxel[][][] = [];
    public debug = true;
    public width: number;
    public depth: number;
    public height: number;
    public textrue?: Texture;

    public constructor(width: number, depth: number, height: number) {
        this.width = width;
        this.depth = depth;
        this.height = height;
        this.init(width, depth, height);
    }

    public init(width: number, depth: number, height: number) {
        this.width = width;
        this.depth = depth;
        this.height = height;

        for (let x = 0; x < this.width; x++) {
            this.voxel[x] = [];
            for (let y = 0; y < this.height; y++) {
                this.voxel[x][y] = [];
                for (let z = 0; z < this.depth; z++) {
                    const voxel = new Voxel();
                    voxel.origin.set(x, y, z);
                    this.voxel[x][y][z] = voxel;
                }
            }
        }
    }

    public getVoxel(point: Vector3): Voxel | undefined {
        const x = Math.round(point.x);
        const y = Math.round(point.y);
        const z = Math.round(point.z);
        if (this.voxel[x] === undefined) return;
        if (this.voxel[x][y] === undefined) return;
        if (this.voxel[x][y][z] === undefined) return;
        return this.voxel[x][y][z];
    }

    public forEachVoxel(fn: (v: Voxel) => void) {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                for (let z = 0; z < this.depth; z++) {
                    fn(this.voxel[x][y][z]);
                }
            }
        }
    }
}
