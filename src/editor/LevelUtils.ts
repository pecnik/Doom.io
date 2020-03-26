import { MeshBasicMaterial, Mesh, NearestFilter, Vector2, PlaneGeometry, Geometry } from "three";
import { Level, Voxel } from "./Level";

export const TILE_W = 64;
export const TILE_H = 64;
export const TEXTURE_W = 512;
export const TEXTURE_H = 512;
export const TILE_COLS = TEXTURE_W / TILE_W;
export const TILE_ROWS = TEXTURE_H / TILE_H;

export function buildLevelMesh(level: Level) {
    const planes = new Array<PlaneGeometry>();
    level.forEachVoxel(voxel => {
        if (voxel.solid) {
            const tileId = 9;
            planes.push(...createVoxelPlanes(voxel, tileId));
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

    const wireframe = new Mesh(geometry, new MeshBasicMaterial({ wireframe: true, color: 0x00ff00 }));
    level.scene.add(wireframe);
}

export function createVoxelPlanes(voxel: Voxel, tileId: number) {
    const planes: PlaneGeometry[] = [];

    {
        const ymin = new PlaneGeometry(1, 1, 1, 1);
        ymin.rotateX(Math.PI * 0.5);
        ymin.translate(voxel.origin.x, voxel.origin.y, voxel.origin.z);
        ymin.translate(0, -0.5, 0);
        setTextureUV(ymin, tileId);
        planes.push(ymin);
    }

    {
        const ymax = new PlaneGeometry(1, 1, 1, 1);
        ymax.rotateX(Math.PI * -0.5);
        ymax.translate(voxel.origin.x, voxel.origin.y, voxel.origin.z);
        ymax.translate(0, 0.5, 0);
        setTextureUV(ymax, tileId);
        planes.push(ymax);
    }

    {
        const xmin = new PlaneGeometry(1, 1, 1, 1);
        xmin.rotateY(Math.PI * -0.5);
        xmin.translate(voxel.origin.x, voxel.origin.y, voxel.origin.z);
        xmin.translate(-0.5, 0, 0);
        setTextureUV(xmin, tileId);
        planes.push(xmin);
    }

    {
        const xmax = new PlaneGeometry(1, 1, 1, 1);
        xmax.rotateY(Math.PI * 0.5);
        xmax.translate(voxel.origin.x, voxel.origin.y, voxel.origin.z);
        xmax.translate(0.5, 0, 0);
        setTextureUV(xmax, tileId);
        planes.push(xmax);
    }

    {
        const zmin = new PlaneGeometry(1, 1, 1, 1);
        zmin.rotateY(Math.PI);
        zmin.translate(voxel.origin.x, voxel.origin.y, voxel.origin.z);
        zmin.translate(0, 0, -0.5);
        setTextureUV(zmin, tileId);
        planes.push(zmin);
    }

    {
        const zmax = new PlaneGeometry(1, 1, 1, 1);
        zmax.translate(voxel.origin.x, voxel.origin.y, voxel.origin.z);
        zmax.translate(0, 0, 0.5);
        setTextureUV(zmax, tileId);
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
};
