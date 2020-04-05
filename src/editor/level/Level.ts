import {
    Mesh,
    Texture,
    PlaneGeometry,
    Geometry,
    MeshBasicMaterial,
    VertexColors,
    Vector3,
    Vector2,
    Color,
    Ray,
    Box3,
} from "three";
import { clamp } from "lodash";

export module Level {
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

    export enum VoxelFace {
        minX = 0,
        maxX = 1,
        minY = 2,
        maxY = 3,
        minZ = 4,
        maxZ = 5,
    }

    export interface Voxel {
        readonly x: number;
        readonly y: number;
        readonly z: number;
        type: VoxelType;
        faces: [number, number, number, number, number, number];
        light: number;
    }

    export interface Matrix {
        readonly voxel: Voxel[][][]; // TODO - turn into 1D array?
        readonly width: number;
        readonly height: number;
        readonly depth: number;
    }

    export class Level {
        public mesh = new Mesh();
        public matrix: Matrix = { voxel: [], width: 0, height: 0, depth: 0 };
        public texture = new Texture();

        public resize(width: number, height: number, depth: number) {
            this.matrix = { width, height, depth, voxel: [] };
            for (let x = 0; x < width; x++) {
                this.matrix.voxel[x] = [];
                for (let y = 0; y < height; y++) {
                    this.matrix.voxel[x][y] = [];
                    for (let z = 0; z < depth; z++) {
                        this.matrix.voxel[x][y][z] = {
                            x,
                            y,
                            z,
                            type: VoxelType.Empty,
                            faces: [0, 0, 0, 0, 0, 0],
                            light: 0x000000,
                        };
                    }
                }
            }
        }

        public getVoxel(x: number, y: number, z: number) {
            const { voxel } = this.matrix;
            if (voxel[x] === undefined) return;
            if (voxel[x][y] === undefined) return;
            if (voxel[x][y][z] === undefined) return;
            return voxel[x][y][z];
        }

        public getVoxelAt(point: { x: number; y: number; z: number }) {
            return this.getVoxel(
                Math.round(point.x),
                Math.round(point.y),
                Math.round(point.z)
            );
        }

        public forEachVoxel(fn: (v: Voxel) => void) {
            const { width, depth, height, voxel } = this.matrix;
            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    for (let z = 0; z < depth; z++) {
                        fn(voxel[x][y][z]);
                    }
                }
            }
        }

        public buildMesh() {
            const planes = new Array<PlaneGeometry>();
            this.forEachVoxel((voxel) => {
                if (voxel.type === VoxelType.Solid) {
                    planes.push(...this.createVoxelGeometry(voxel));
                }
            });

            const geometry = new Geometry();
            planes.forEach((plane) => geometry.merge(plane));
            planes.forEach((plane) => plane.dispose());
            geometry.elementsNeedUpdate = true;

            const material = new MeshBasicMaterial({
                map: this.texture,
                vertexColors: VertexColors,
            });

            this.mesh = new Mesh(geometry, material);
        }

        public addWireframe() {
            const geometry = this.mesh.geometry;
            const material = new MeshBasicMaterial({
                wireframe: true,
                color: 0x00ff00,
            });
            const wireframe = new Mesh(geometry, material);
            this.mesh.add(wireframe);
        }

        public addLighting() {
            const lights: Vector3[] = [];
            this.forEachVoxel((voxel) => {
                if (voxel.type === VoxelType.Light) {
                    lights.push(new Vector3(voxel.x, voxel.y, voxel.z));
                }
            });

            const colorOfLight = (light: Vector3) => {
                const voxel = this.getVoxelAt(light);
                if (voxel === undefined) return new Color(0xffffff);
                return new Color(voxel.light);
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
                            const voxel = this.getVoxelAt(point);
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

            const sampleLightColor = (point: Vector3, normal: Vector3) => {
                const result = new Color(0.2, 0.2, 0.3);

                for (let l = 0; l < lights.length; l++) {
                    const light = lights[l];

                    // Test if facing light
                    if (normal.x === +1 && light.x < point.x) continue;
                    if (normal.x === -1 && light.x > point.x) continue;
                    if (normal.y === +1 && light.y < point.y) continue;
                    if (normal.y === -1 && light.y > point.y) continue;
                    if (normal.z === +1 && light.z < point.z) continue;
                    if (normal.z === -1 && light.z > point.z) continue;

                    // Test if point reaches
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
            const geometry = this.mesh.geometry as Geometry;
            for (let i = 0; i < geometry.faces.length; i++) {
                const face = geometry.faces[i];
                const verts = geometry.vertices;
                face.vertexColors[0] = sampleLightColor(
                    verts[face.a],
                    face.normal
                );
                face.vertexColors[1] = sampleLightColor(
                    verts[face.b],
                    face.normal
                );
                face.vertexColors[2] = sampleLightColor(
                    verts[face.c],
                    face.normal
                );
            }

            geometry.elementsNeedUpdate = true;
        }

        private createVoxelGeometry(voxel: Voxel) {
            const planes: PlaneGeometry[] = [];

            const voxelOrigin = new Vector3(voxel.x, voxel.y, voxel.z);

            const hasSolidNeighbor = (x: number, y: number, z: number) => {
                const voxel = this.getVoxel(
                    voxelOrigin.x + x,
                    voxelOrigin.y + y,
                    voxelOrigin.z + z
                );
                return voxel !== undefined && voxel.type === VoxelType.Solid;
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
    }
}
