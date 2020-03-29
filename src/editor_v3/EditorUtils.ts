import {
    MeshBasicMaterial,
    Mesh,
    NearestFilter,
    Vector2,
    PlaneGeometry,
    Geometry,
    Texture,
    TextureLoader,
    Vector3
} from "three";
import { LevelData, VoxelData } from "./EditorWorld";

export const TILE_W = 64;
export const TILE_H = 64;
export const TEXTURE_W = 512;
export const TEXTURE_H = 512;
export const TILE_COLS = TEXTURE_W / TILE_W;
export const TILE_ROWS = TEXTURE_H / TILE_H;
export const TILE_COUNT = TILE_COLS * TILE_ROWS;

export function loadTexture(src: string): Promise<Texture> {
    return new Promise(resolve => {
        new TextureLoader().load(src, map => {
            map.minFilter = NearestFilter;
            map.magFilter = NearestFilter;
            resolve(map);
        });
    });
}

export function createLevel(
    width: number,
    height: number,
    depth: number
): LevelData {
    const voxel: VoxelData[][][] = [];
    for (let x = 0; x < width; x++) {
        voxel[x] = [];
        for (let y = 0; y < height; y++) {
            voxel[x][y] = [];
            for (let z = 0; z < depth; z++) {
                voxel[x][y][z] = {
                    x,
                    y,
                    z,
                    solid: false,
                    faces: [0, 0, 0, 0, 0, 0]
                };
            }
        }
    }

    return { width, height, depth, voxel: voxel };
}

export function getVoxel(level: LevelData, point: Vector3) {
    const x = Math.round(point.x);
    const y = Math.round(point.y);
    const z = Math.round(point.z);
    if (level.voxel[x] === undefined) return;
    if (level.voxel[x][y] === undefined) return;
    if (level.voxel[x][y][z] === undefined) return;
    return level.voxel[x][y][z];
}

export function forEachVoxel(level: LevelData, fn: (v: VoxelData) => void) {
    for (let x = 0; x < level.width; x++) {
        for (let y = 0; y < level.height; y++) {
            for (let z = 0; z < level.depth; z++) {
                fn(level.voxel[x][y][z]);
            }
        }
    }
}

export function createLevelMesh(level: LevelData, map: Texture) {
    const planes = new Array<PlaneGeometry>();
    forEachVoxel(level, voxel => {
        if (voxel.solid) {
            planes.push(...createVoxelPlanes(voxel, level));
        }
    });

    const geometry = new Geometry();
    planes.forEach(plane => geometry.merge(plane));
    planes.forEach(plane => plane.dispose());
    geometry.elementsNeedUpdate = true;

    const material = new MeshBasicMaterial({ map });
    const wireframe = new MeshBasicMaterial({
        wireframe: true,
        color: 0x00ff00
    });

    return new Mesh(geometry, material).add(new Mesh(geometry, wireframe));
}

export function createVoxelPlanes(voxel: VoxelData, level: LevelData) {
    const planes: PlaneGeometry[] = [];

    const voxelOrigin = new Vector3(voxel.x, voxel.y, voxel.z);

    const hasSolidNeighbor = (x: number, y: number, z: number) => {
        const origin = voxelOrigin.clone();
        origin.x += x;
        origin.y += y;
        origin.z += z;

        const neighbor = getVoxel(level, origin);
        if (neighbor === undefined) return false;
        else return neighbor.solid;
    };

    if (!hasSolidNeighbor(-1, 0, 0)) {
        const xmin = new PlaneGeometry(1, 1, 1, 1);
        setTextureUV(xmin, voxel.faces[0]);
        xmin.rotateY(Math.PI * -0.5);
        xmin.translate(voxelOrigin.x, voxelOrigin.y, voxelOrigin.z);
        xmin.translate(-0.5, 0, 0);
        planes.push(xmin);
    }

    if (!hasSolidNeighbor(1, 0, 0)) {
        const xmax = new PlaneGeometry(1, 1, 1, 1);
        setTextureUV(xmax, voxel.faces[1]);
        xmax.rotateY(Math.PI * 0.5);
        xmax.translate(voxelOrigin.x, voxelOrigin.y, voxelOrigin.z);
        xmax.translate(0.5, 0, 0);
        planes.push(xmax);
    }

    if (!hasSolidNeighbor(0, -1, 0)) {
        const ymin = new PlaneGeometry(1, 1, 1, 1);
        setTextureUV(ymin, voxel.faces[2]);
        ymin.rotateX(Math.PI * 0.5);
        ymin.translate(voxelOrigin.x, voxelOrigin.y, voxelOrigin.z);
        ymin.translate(0, -0.5, 0);
        planes.push(ymin);
    }

    if (!hasSolidNeighbor(0, 1, 0)) {
        const ymax = new PlaneGeometry(1, 1, 1, 1);
        setTextureUV(ymax, voxel.faces[3]);
        ymax.rotateX(Math.PI * -0.5);
        ymax.translate(voxelOrigin.x, voxelOrigin.y, voxelOrigin.z);
        ymax.translate(0, 0.5, 0);
        planes.push(ymax);
    }

    if (!hasSolidNeighbor(0, 0, -1)) {
        const zmin = new PlaneGeometry(1, 1, 1, 1);
        setTextureUV(zmin, voxel.faces[4]);
        zmin.rotateY(Math.PI);
        zmin.translate(voxelOrigin.x, voxelOrigin.y, voxelOrigin.z);
        zmin.translate(0, 0, -0.5);
        planes.push(zmin);
    }

    if (!hasSolidNeighbor(0, 0, 1)) {
        const zmax = new PlaneGeometry(1, 1, 1, 1);
        setTextureUV(zmax, voxel.faces[5]);
        zmax.translate(voxelOrigin.x, voxelOrigin.y, voxelOrigin.z);
        zmax.translate(0, 0, 0.5);
        planes.push(zmax);
    }

    return planes;
}

export function setTextureUV(plane: PlaneGeometry, tileId: number) {
    const cords: Vector2[][] = plane.faceVertexUvs[0];

    // preload UV
    const tileU = TILE_W / TEXTURE_W;
    const tileV = TILE_H / TEXTURE_H;

    cords[0][0].set(0, 1);
    cords[0][1].set(0, 1 - tileV);
    cords[0][2].set(tileU, 1);

    cords[1][0].set(0, 1 - tileV);
    cords[1][1].set(tileU, 1 - tileV);
    cords[1][2].set(tileU, 1);

    // Offset by tileID
    let x = tileId % TILE_COLS;
    let y = Math.floor(tileId / TILE_COLS);
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 3; j++) {
            cords[i][j].x += tileU * x;
            cords[i][j].y -= tileV * y;
        }
    }

    plane.elementsNeedUpdate = true;
}
