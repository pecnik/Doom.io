import { Scene, PerspectiveCamera, Mesh, Texture } from "three";

export interface VoxelData {
    x: number;
    y: number;
    z: number;
    solid: boolean;
    faces: [number, number, number, number, number, number];
}

export interface LevelData {
    readonly voxels: VoxelData[][][];
    readonly width: number;
    readonly height: number;
    readonly depth: number;
}

export class EditorWorld {
    public readonly scene = new Scene();
    public readonly camera = new PerspectiveCamera(90);
    public elapsedTime = 0;
    public floor = new Mesh();
    public level = new Mesh();
    public texture = new Texture();
}
