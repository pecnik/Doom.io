import {
    Mesh,
    Texture,
    PlaneGeometry,
    Vector3,
    Vector2,
    MeshBasicMaterial,
    VertexColors as vertexColors,
    Geometry,
    Color
} from "three";
import { disposeMeshMaterial } from "../game/utils/Helpers";

export const TILE_W = 64;
export const TILE_H = 64;
export const TEXTURE_W = 512;
export const TEXTURE_H = 512;
export const TILE_COLS = TEXTURE_W / TILE_W;

export enum VoxelType {
    Empty,
    Solid
}

export class VoxelData {
    public index = 0;
    public x = 0;
    public y = 0;
    public z = 0;
    public type = VoxelType.Solid;
    public faces: [number, number, number, number, number, number] = [
        0,
        0,
        0,
        0,
        0,
        0
    ];
}

export class LevelData {
    public voxel: VoxelData[] = [];
    public max_x = 0;
    public max_y = 0;
    public max_z = 0;
}

export class Level {
    public data = new LevelData();
    public mesh = new Mesh();
    public wireframe = new Mesh();
    public updatedAt = Date.now();

    public getVoxel(x: number, y: number, z: number) {
        const { voxel, max_x, max_y, max_z } = this.data;
        if (x < 0 || x >= max_x) return;
        if (y < 0 || y >= max_y) return;
        if (z < 0 || z >= max_z) return;

        const index = x + y * max_x + z * max_x * max_y;
        return voxel[index];
    }

    public getVoxelAt(vec: Vector3) {
        return this.getVoxel(
            Math.round(vec.x),
            Math.round(vec.y),
            Math.round(vec.z)
        );
    }

    public setSize(max_x: number, max_y: number, max_z: number) {
        this.data.max_x = max_x;
        this.data.max_y = max_y;
        this.data.max_z = max_z;
        this.data.voxel = [];
        for (let z = 0; z < max_z; z++) {
            for (let y = 0; y < max_y; y++) {
                for (let x = 0; x < max_x; x++) {
                    const index = x + y * max_x + z * max_x * max_y;
                    this.data.voxel.push({
                        index,
                        faces: [0, 0, 0, 0, 0, 0],
                        type: VoxelType.Empty,
                        x,
                        y,
                        z
                    });
                }
            }
        }
    }

    public setMaterial(texture: Texture) {
        disposeMeshMaterial(this.mesh.material);
        this.mesh.material = new MeshBasicMaterial({
            vertexColors,
            map: texture
        });

        disposeMeshMaterial(this.wireframe.material);
        this.wireframe.material = new MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true
        });
    }

    public updateGeometry() {
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

        const createVoxelGeometry = (voxel: VoxelData) => {
            const planes: PlaneGeometry[] = [];
            const origin = new Vector3(voxel.x, voxel.y, voxel.z);
            const hasSolidNeighbor = (x: number, y: number, z: number) => {
                const voxel = this.getVoxel(
                    origin.x + x,
                    origin.y + y,
                    origin.z + z
                );
                return voxel !== undefined && voxel.type === VoxelType.Solid;
            };

            if (!hasSolidNeighbor(-1, 0, 0)) {
                const xmin = new PlaneGeometry(1, 1, 1, 1);
                setTextureUV(xmin, voxel.faces[0]);
                xmin.rotateY(Math.PI * -0.5);
                xmin.translate(origin.x, origin.y, origin.z);
                xmin.translate(-0.5, 0, 0);
                planes.push(xmin);
            }

            if (!hasSolidNeighbor(1, 0, 0)) {
                const xmax = new PlaneGeometry(1, 1, 1, 1);
                setTextureUV(xmax, voxel.faces[1]);
                xmax.rotateY(Math.PI * 0.5);
                xmax.translate(origin.x, origin.y, origin.z);
                xmax.translate(0.5, 0, 0);
                planes.push(xmax);
            }

            if (!hasSolidNeighbor(0, -1, 0)) {
                const ymin = new PlaneGeometry(1, 1, 1, 1);
                setTextureUV(ymin, voxel.faces[2]);
                ymin.rotateX(Math.PI * 0.5);
                ymin.translate(origin.x, origin.y, origin.z);
                ymin.translate(0, -0.5, 0);
                planes.push(ymin);
            }

            if (!hasSolidNeighbor(0, 1, 0)) {
                const ymax = new PlaneGeometry(1, 1, 1, 1);
                setTextureUV(ymax, voxel.faces[3]);
                ymax.rotateX(Math.PI * -0.5);
                ymax.translate(origin.x, origin.y, origin.z);
                ymax.translate(0, 0.5, 0);
                planes.push(ymax);
            }

            if (!hasSolidNeighbor(0, 0, -1)) {
                const zmin = new PlaneGeometry(1, 1, 1, 1);
                setTextureUV(zmin, voxel.faces[4]);
                zmin.rotateY(Math.PI);
                zmin.translate(origin.x, origin.y, origin.z);
                zmin.translate(0, 0, -0.5);
                planes.push(zmin);
            }

            if (!hasSolidNeighbor(0, 0, 1)) {
                const zmax = new PlaneGeometry(1, 1, 1, 1);
                setTextureUV(zmax, voxel.faces[5]);
                zmax.translate(origin.x, origin.y, origin.z);
                zmax.translate(0, 0, 0.5);
                planes.push(zmax);
            }

            return planes;
        };

        const planes = new Array<PlaneGeometry>();
        this.data.voxel.forEach(voxel => {
            if (voxel.type === VoxelType.Solid) {
                planes.push(...createVoxelGeometry(voxel));
            }
        });

        const geometry = new Geometry();
        planes.forEach(plane => geometry.merge(plane));
        planes.forEach(plane => plane.dispose());
        geometry.elementsNeedUpdate = true;

        this.mesh.geometry.dispose();
        this.wireframe.geometry.dispose();

        this.mesh.geometry = geometry;
        this.wireframe.geometry = geometry;

        this.updateLighing();

        this.updatedAt = Date.now();
    }

    private updateLighing() {
        const darken2 = new Color(0x222222);
        const darken1 = new Color(0x444444);
        const lighten1 = new Color(0x666666);
        const lighten2 = new Color(0x888888);
        const getBaseLight = (normal: Vector3): Color => {
            if (normal.x === +1) return darken1;
            if (normal.x === -1) return darken1;

            if (normal.y === +1) return lighten2;
            if (normal.y === -1) return darken2;

            if (normal.z === +1) return darken2;
            if (normal.z === -1) return lighten1;

            return lighten2;
        };

        const aggregateLight = (vertex: Vector3, normal: Vector3) => {
            const min_y = Math.ceil(vertex.y + normal.y * 0.25);
            const max_y = this.data.max_y;

            const rad = 0.25;
            const x = Math.round(vertex.x + normal.x * rad);
            const z = Math.round(vertex.z + normal.z * rad);
            for (let y = min_y; y < max_y; y++) {
                const voxel1 = this.getVoxel(x, y, z);
                if (voxel1 && voxel1.type === VoxelType.Solid) return 0.5;
            }

            return 1;
        };

        const geometry = this.mesh.geometry as Geometry;
        const vertices = new Array<Vector3>();
        geometry.faces.forEach(face => {
            // Get face vertices
            vertices[0] = geometry.vertices[face.a];
            vertices[1] = geometry.vertices[face.b];
            vertices[2] = geometry.vertices[face.c];

            // Basic lighting
            const baseLight = getBaseLight(face.normal);
            face.vertexColors[0] = baseLight.clone();
            face.vertexColors[1] = baseLight.clone();
            face.vertexColors[2] = baseLight.clone();

            // Get face origin
            const origin = new Vector3();
            vertices.forEach(v => origin.add(v));
            origin.divideScalar(3);

            // Cast shadow lighting
            const light = aggregateLight(origin, face.normal);
            for (let i = 0; i < 3; i++) {
                face.vertexColors[i].r += light;
                face.vertexColors[i].g += light;
                face.vertexColors[i].b += light;
            }

            // Ambient occlusion pass
            const aofac = 0.125;
            if (
                Math.abs(face.normal.x) === 1 ||
                Math.abs(face.normal.z) === 1
            ) {
                const above = this.getVoxel(
                    Math.round(origin.x + face.normal.x * 0.5),
                    Math.round(origin.y + 1),
                    Math.round(origin.z + face.normal.z * 0.5)
                );

                if (above && above.type === VoxelType.Solid) {
                    for (let i = 0; i < vertices.length; i++) {
                        if (vertices[i].y > origin.y) {
                            face.vertexColors[i].r -= aofac;
                            face.vertexColors[i].g -= aofac;
                            face.vertexColors[i].b -= aofac;
                        }
                    }
                }

                const bottom = this.getVoxel(
                    Math.round(origin.x + face.normal.x * 0.5),
                    Math.round(origin.y - 1),
                    Math.round(origin.z + face.normal.z * 0.5)
                );

                if (bottom && bottom.type === VoxelType.Solid) {
                    for (let i = 0; i < vertices.length; i++) {
                        if (vertices[i].y < origin.y) {
                            face.vertexColors[i].r -= aofac;
                            face.vertexColors[i].g -= aofac;
                            face.vertexColors[i].b -= aofac;
                        }
                    }
                }
            }

            const maxDark = 0.1;
            face.vertexColors.forEach(color => {
                color.r = Math.max(color.r, maxDark);
                color.g = Math.max(color.g, maxDark);
                color.b = Math.max(color.b, maxDark);
            });
        });
    }
}
