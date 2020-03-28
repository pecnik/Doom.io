import {
    MeshBasicMaterial,
    Mesh,
    NearestFilter,
    Vector2,
    PlaneGeometry,
    Geometry,
    Texture,
    TextureLoader
} from "three";
import { EditorLevel, Voxel } from "./data/EditorLevel";

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

export function buildLevelMesh(level: EditorLevel) {
    const planes = new Array<PlaneGeometry>();
    level.forEachVoxel(voxel => {
        if (voxel.solid) {
            planes.push(...createVoxelPlanes(voxel, level));
        }
    });

    const geometry = new Geometry();
    planes.forEach(plane => geometry.merge(plane));
    planes.forEach(plane => plane.dispose());
    geometry.elementsNeedUpdate = true;

    const material = new MeshBasicMaterial({ map: level.textrue });
    if (level.textrue) {
        level.textrue.minFilter = NearestFilter;
        level.textrue.magFilter = NearestFilter;
    }

    const mesh = new Mesh(geometry, material);
    level.scene.remove(...level.scene.children);
    level.scene.add(mesh);

    const wireframe = new Mesh(
        geometry,
        new MeshBasicMaterial({ wireframe: true, color: 0x00ff00 })
    );
    level.scene.add(wireframe);
}

export function createVoxelPlanes(voxel: Voxel, level: EditorLevel) {
    const planes: PlaneGeometry[] = [];

    const hasSolidNeighbor = (x: number, y: number, z: number) => {
        const origin = voxel.origin.clone();
        origin.x += x;
        origin.y += y;
        origin.z += z;

        const neighbor = level.getVoxel(origin);
        if (neighbor === undefined) return false;
        else return neighbor.solid;
    };

    if (!hasSolidNeighbor(-1, 0, 0)) {
        const xmin = new PlaneGeometry(1, 1, 1, 1);
        setTextureUV(xmin, voxel.faces[0]);
        xmin.rotateY(Math.PI * -0.5);
        xmin.translate(voxel.origin.x, voxel.origin.y, voxel.origin.z);
        xmin.translate(-0.5, 0, 0);
        planes.push(xmin);
    }

    if (!hasSolidNeighbor(1, 0, 0)) {
        const xmax = new PlaneGeometry(1, 1, 1, 1);
        setTextureUV(xmax, voxel.faces[1]);
        xmax.rotateY(Math.PI * 0.5);
        xmax.translate(voxel.origin.x, voxel.origin.y, voxel.origin.z);
        xmax.translate(0.5, 0, 0);
        planes.push(xmax);
    }

    if (!hasSolidNeighbor(0, -1, 0)) {
        const ymin = new PlaneGeometry(1, 1, 1, 1);
        setTextureUV(ymin, voxel.faces[2]);
        ymin.rotateX(Math.PI * 0.5);
        ymin.translate(voxel.origin.x, voxel.origin.y, voxel.origin.z);
        ymin.translate(0, -0.5, 0);
        planes.push(ymin);
    }

    if (!hasSolidNeighbor(0, 1, 0)) {
        const ymax = new PlaneGeometry(1, 1, 1, 1);
        setTextureUV(ymax, voxel.faces[3]);
        ymax.rotateX(Math.PI * -0.5);
        ymax.translate(voxel.origin.x, voxel.origin.y, voxel.origin.z);
        ymax.translate(0, 0.5, 0);
        planes.push(ymax);
    }

    if (!hasSolidNeighbor(0, 0, -1)) {
        const zmin = new PlaneGeometry(1, 1, 1, 1);
        setTextureUV(zmin, voxel.faces[4]);
        zmin.rotateY(Math.PI);
        zmin.translate(voxel.origin.x, voxel.origin.y, voxel.origin.z);
        zmin.translate(0, 0, -0.5);
        planes.push(zmin);
    }

    if (!hasSolidNeighbor(0, 0, 1)) {
        const zmax = new PlaneGeometry(1, 1, 1, 1);
        setTextureUV(zmax, voxel.faces[5]);
        zmax.translate(voxel.origin.x, voxel.origin.y, voxel.origin.z);
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
    let x = (tileId - 1) % TILE_COLS;
    let y = Math.floor((tileId - 1) / TILE_COLS);
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 3; j++) {
            cords[i][j].x += tileU * x;
            cords[i][j].y -= tileV * y;
        }
    }
}
