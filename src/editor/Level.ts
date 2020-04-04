import {
    Vector3,
    Texture,
    PlaneGeometry,
    Geometry,
    MeshBasicMaterial,
    VertexColors,
    Mesh,
    Vector2,
    Color,
    Ray,
    Box3,
} from "three";
import { clamp } from "lodash";

export const TILE_W = 64;
export const TILE_H = 64;
export const TEXTURE_W = 512;
export const TEXTURE_H = 512;
export const TILE_COLS = TEXTURE_W / TILE_W;

export enum VoxelType {
    Empty,
    Solid,
    Light,
}

export class Voxel {
    public readonly x: number;
    public readonly y: number;
    public readonly z: number;

    public type = VoxelType.Empty;
    public tileId = 0;
    public faces = [0, 0, 0, 0, 0, 0];

    public constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

export class Level {
    public readonly voxel: Voxel[][][] = [];
    public readonly width: number;
    public readonly height: number;
    public readonly depth: number;

    public constructor(width: number, height: number, depth: number) {
        this.width = width;
        this.height = height;
        this.depth = depth;

        for (let x = 0; x < width; x++) {
            this.voxel[x] = [];
            for (let y = 0; y < height; y++) {
                this.voxel[x][y] = [];
                for (let z = 0; z < depth; z++) {
                    this.voxel[x][y][z] = new Voxel(x, y, z);
                }
            }
        }
    }
}

export module Level {
    export function create(width: number, height: number, depth: number) {
        return new Level(width, height, depth);
    }

    export function createMesh(level: Level, map: Texture) {
        const planes = new Array<PlaneGeometry>();
        forEachVoxel(level, (voxel) => {
            if (voxel.type === VoxelType.Solid) {
                planes.push(...createVoxelGeo(voxel, level));
            }
        });

        const geometry = new Geometry();
        planes.forEach((plane) => geometry.merge(plane));
        planes.forEach((plane) => plane.dispose());
        geometry.elementsNeedUpdate = true;

        const material = new MeshBasicMaterial({
            map,
            vertexColors: VertexColors,
        });
        return new Mesh(geometry, material);
    }

    export function createLightMesh(level: Level, map: Texture) {
        const planes = new Array<PlaneGeometry>();
        forEachVoxel(level, (voxel) => {
            if (voxel.type === VoxelType.Light) {
                planes.push(...createVoxelGeo(voxel, level));
            }
        });

        const geometry = new Geometry();
        planes.forEach((plane) => geometry.merge(plane));
        planes.forEach((plane) => plane.dispose());
        geometry.elementsNeedUpdate = true;

        const material = new MeshBasicMaterial({
            map,
            vertexColors: VertexColors,
        });
        return new Mesh(geometry, material);
    }

    export function createVoxelGeo(voxel: Voxel, level: Level) {
        const planes: PlaneGeometry[] = [];

        const voxelOrigin = new Vector3(voxel.x, voxel.y, voxel.z);

        const hasSolidNeighbor = (x: number, y: number, z: number) => {
            const origin = voxelOrigin.clone();
            origin.x += x;
            origin.y += y;
            origin.z += z;

            const neighbor = getVoxel(level, origin);
            if (neighbor === undefined) return false;
            else return neighbor.type === VoxelType.Solid;
        };

        const setTextureUV = (plane: PlaneGeometry, tileId: number) => {
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

    export function updateMeshLighting(level: Level, mesh: Mesh) {
        const lights: Vector3[] = [];
        forEachVoxel(level, (voxel) => {
            if (voxel.type === VoxelType.Light) {
                lights.push(new Vector3(voxel.x, voxel.y, voxel.z));
            }
        });

        const W = new Color(1, 1, 1);
        const R = new Color(1, 0, 0);
        const G = new Color(0, 1, 0);
        const B = new Color(0, 0, 1);
        const colorOfLight = (light: Vector3) => {
            const voxel = getVoxel(level, light);
            if (voxel === undefined) return W;
            if (voxel.tileId === 0) return W;
            if (voxel.tileId === 1) return R;
            if (voxel.tileId === 2) return G;
            if (voxel.tileId === 3) return B;
            return W;
        };

        const ray = new Ray();
        const box = new Box3();
        const reachedLight = (origin: Vector3, light: Vector3) => {
            ray.origin.copy(origin);
            ray.direction.subVectors(light, origin).normalize();

            const min_x = Math.floor(Math.min(origin.x, light.x));
            const min_y = Math.floor(Math.min(origin.y, light.y));
            const min_z = Math.floor(Math.min(origin.z, light.z));

            const max_x = Math.ceil(Math.max(origin.x, light.x)) + 1;
            const max_y = Math.ceil(Math.max(origin.y, light.y)) + 1;
            const max_z = Math.ceil(Math.max(origin.z, light.z)) + 1;

            for (let _x = min_x; _x < max_x; _x++) {
                for (let _y = min_y; _y < max_y; _y++) {
                    for (let _z = min_z; _z < max_z; _z++) {
                        const point = new Vector3(_x, _y, _z);
                        const voxel = Level.getVoxel(level, point);
                        if (voxel && voxel.type === VoxelType.Solid) {
                            box.min.copy(point).subScalar(0.49);
                            box.max.copy(point).addScalar(0.49);
                            if (ray.intersectsBox(box)) {
                                return false;
                            }
                        }
                    }
                }
            }

            return true;
        };

        const sampleLightColor = (point: Vector3) => {
            const result = new Color(0.2, 0.2, 0.3);

            for (let l = 0; l < lights.length; l++) {
                const light = lights[l];
                if (reachedLight(point, light)) {
                    const lightRad = 32;
                    const lightCol = colorOfLight(light);

                    let value = point.distanceToSquared(light);
                    value = clamp(value, 0, lightRad);
                    value = (lightRad - value) / lightRad;

                    result.r += lightCol.r * value;
                    result.g += lightCol.g * value;
                    result.b += lightCol.b * value;
                }
            }

            return result;
        };

        // Set vertex colors
        const geometry = mesh.geometry as Geometry;
        for (let i = 0; i < geometry.faces.length; i++) {
            const face = geometry.faces[i];
            face.vertexColors[0] = sampleLightColor(geometry.vertices[face.a]);
            face.vertexColors[1] = sampleLightColor(geometry.vertices[face.b]);
            face.vertexColors[2] = sampleLightColor(geometry.vertices[face.c]);
        }

        geometry.elementsNeedUpdate = true;
    }

    export function getVoxel(level: Level, point: Vector3) {
        const x = Math.round(point.x);
        const y = Math.round(point.y);
        const z = Math.round(point.z);
        if (level.voxel[x] === undefined) return;
        if (level.voxel[x][y] === undefined) return;
        if (level.voxel[x][y][z] === undefined) return;
        return level.voxel[x][y][z];
    }

    export function getVoxelLightColor(_: Level, __: Vector3) {
        return new Color(1, 1, 1);
    }

    export function forEachVoxel(level: Level, fn: (v: Voxel) => void) {
        for (let x = 0; x < level.width; x++) {
            for (let y = 0; y < level.height; y++) {
                for (let z = 0; z < level.depth; z++) {
                    fn(level.voxel[x][y][z]);
                }
            }
        }
    }
}
