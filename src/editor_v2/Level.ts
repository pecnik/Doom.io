import {
    Mesh,
    Vector3,
    Color,
    Box3,
    PlaneGeometry,
    MeshBasicMaterial,
    Vector2,
    Geometry,
    VertexColors,
} from "three";
import { disposeMeshMaterial, loadTexture } from "../game/Helpers";

export const TILE_W = 64;
export const TILE_H = 64;
export const TEXTURE_W = 512;
export const TEXTURE_H = 512;
export const TILE_COLS = Math.floor(TEXTURE_W / TILE_W);
export const TILE_ROWS = Math.floor(TEXTURE_H / TILE_H);

export class LevelBlock {
    public readonly index: number;
    public readonly origin: Vector3;
    public readonly aabb: Box3;

    public faces = [0, 0, 0, 0, 0, 0].map((x) => x + 16);
    public solid = false;
    public bounce = 0;
    public emitLight: undefined | Color = undefined;

    public constructor(index: number, x: number, y: number, z: number) {
        this.index = index;
        this.origin = new Vector3(x, y, z);
        this.aabb = new Box3();
        this.aabb.min = this.origin.clone().addScalar(-0.5);
        this.aabb.max = this.origin.clone().addScalar(+0.5);
        Object.freeze(this.origin);
        Object.freeze(this.aabb.min);
        Object.freeze(this.aabb.max);
    }

    public copy(block: LevelBlock) {
        this.faces = block.faces.concat([]);
        this.solid = block.solid;
        this.bounce = block.bounce;
        this.emitLight = block.emitLight;
    }

    public getFaceIndex(normal: Vector3) {
        if (normal.x === -1) return 0;
        if (normal.x === +1) return 1;
        if (normal.y === -1) return 2;
        if (normal.y === +1) return 3;
        if (normal.z === -1) return 4;
        if (normal.z === +1) return 5;
        return -1;
    }
}

export class Level {
    public width = 0;
    public height = 0;
    public depth = 0;
    public blocks: LevelBlock[] = [];

    public readonly mesh = new Mesh();

    public readonly floor = new Mesh(
        new PlaneGeometry(),
        new MeshBasicMaterial({
            transparent: true,
            wireframe: true,
            opacity: 0.25,
            color: 0xffffff,
        })
    );

    public readonly wireframe = new Mesh(
        new Geometry(),
        new MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
            transparent: true,
            opacity: 0.5,
        })
    );

    public getBlock(x: number, y: number, z: number) {
        const { width, height, depth } = this;
        if (x < 0 || x >= width) return;
        if (y < 0 || y >= height) return;
        if (z < 0 || z >= depth) return;

        const index = x + y * width + z * width * height;
        return this.blocks[index];
    }

    public getBlockAt(vec: Vector3) {
        return this.getBlock(
            Math.round(vec.x),
            Math.round(vec.y),
            Math.round(vec.z)
        );
    }

    public loadMaterial() {
        return loadTexture("/assets/tileset.png").then((map) => {
            disposeMeshMaterial(this.mesh.material);
            this.mesh.material = new MeshBasicMaterial({
                vertexColors: VertexColors,
                map,
            });
        });
    }

    public resize(width: number, height: number, depth: number) {
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.blocks = [];

        for (let z = 0; z < depth; z++) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const index = x + y * width + z * width * height;
                    const block = new LevelBlock(index, x, y, z);
                    this.blocks.push(block);
                }
            }
        }
    }

    public updateGeometry() {
        this.updateMeshGeometry();
        this.updateFloorGeometry();
        this.wireframe.geometry.dispose();
        this.wireframe.geometry = this.mesh.geometry.clone();
    }

    private updateMeshGeometry() {
        const setTextureUV = (plane: PlaneGeometry, tileId: number) => {
            const cords: Vector2[][] = plane.faceVertexUvs[0];

            // preload UV
            const padU = 1 / TEXTURE_W;
            const padV = 1 / TEXTURE_H;
            const tileW = TILE_W / TEXTURE_W;
            const tileH = TILE_H / TEXTURE_H;

            // padding to prevent seams
            const minU = padU;
            const maxU = tileW - padU;
            const maxV = 1 - padV;
            const minV = 1 - tileH + padV;

            cords[0][0].set(minU, maxV);
            cords[0][1].set(minU, minV);
            cords[0][2].set(maxU, maxV);

            cords[1][0].set(minU, minV);
            cords[1][1].set(maxU, minV);
            cords[1][2].set(maxU, maxV);

            // Offset by tileID
            let x = tileId % TILE_COLS;
            let y = Math.floor(tileId / TILE_COLS);
            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < 3; j++) {
                    cords[i][j].x += tileW * x;
                    cords[i][j].y -= tileH * y;
                }
            }

            plane.elementsNeedUpdate = true;
        };

        // Basic shading
        const bright2 = new Color(2, 2, 2);
        const bright1 = new Color(1, 1, 1);
        const dark1 = new Color(0.75, 0.75, 0.75);
        const dark2 = new Color(0.5, 0.5, 0.5);
        const setVertexColor = (plane: PlaneGeometry, color: Color) => {
            plane.faces[0].vertexColors[0] = color;
            plane.faces[0].vertexColors[1] = color;
            plane.faces[0].vertexColors[2] = color;
            plane.faces[1].vertexColors[0] = color;
            plane.faces[1].vertexColors[1] = color;
            plane.faces[1].vertexColors[2] = color;
        };

        const createBlockGeometry = (block: LevelBlock) => {
            const { origin } = block;
            const planes: PlaneGeometry[] = [];
            const hasSolidNeighbor = (x: number, y: number, z: number) => {
                const neighbor = this.getBlock(
                    origin.x + x,
                    origin.y + y,
                    origin.z + z
                );
                return neighbor !== undefined && neighbor.solid;
            };

            if (!hasSolidNeighbor(-1, 0, 0)) {
                const xmin = new PlaneGeometry(1, 1, 1, 1);
                setTextureUV(xmin, block.faces[0]);
                setVertexColor(xmin, bright1);
                xmin.rotateY(Math.PI * -0.5);
                xmin.translate(origin.x, origin.y, origin.z);
                xmin.translate(-0.5, 0, 0);
                planes.push(xmin);
            }

            if (!hasSolidNeighbor(1, 0, 0)) {
                const xmax = new PlaneGeometry(1, 1, 1, 1);
                setTextureUV(xmax, block.faces[1]);
                setVertexColor(xmax, bright1);
                xmax.rotateY(Math.PI * 0.5);
                xmax.translate(origin.x, origin.y, origin.z);
                xmax.translate(0.5, 0, 0);
                planes.push(xmax);
            }

            if (!hasSolidNeighbor(0, -1, 0)) {
                const ymin = new PlaneGeometry(1, 1, 1, 1);
                setTextureUV(ymin, block.faces[2]);
                setVertexColor(ymin, dark2);
                ymin.rotateX(Math.PI * 0.5);
                ymin.translate(origin.x, origin.y, origin.z);
                ymin.translate(0, -0.5, 0);
                planes.push(ymin);
            }

            if (!hasSolidNeighbor(0, 1, 0)) {
                const ymax = new PlaneGeometry(1, 1, 1, 1);
                setTextureUV(ymax, block.faces[3]);
                setVertexColor(ymax, bright2);
                ymax.rotateX(Math.PI * -0.5);
                ymax.translate(origin.x, origin.y, origin.z);
                ymax.translate(0, 0.5, 0);
                planes.push(ymax);
            }

            if (!hasSolidNeighbor(0, 0, -1)) {
                const zmin = new PlaneGeometry(1, 1, 1, 1);
                setTextureUV(zmin, block.faces[4]);
                setVertexColor(zmin, dark1);
                zmin.rotateY(Math.PI);
                zmin.translate(origin.x, origin.y, origin.z);
                zmin.translate(0, 0, -0.5);
                planes.push(zmin);
            }

            if (!hasSolidNeighbor(0, 0, 1)) {
                const zmax = new PlaneGeometry(1, 1, 1, 1);
                setTextureUV(zmax, block.faces[5]);
                setVertexColor(zmax, dark1);
                zmax.translate(origin.x, origin.y, origin.z);
                zmax.translate(0, 0, 0.5);
                planes.push(zmax);
            }

            return planes;
        };

        const planes = new Array<Geometry>();
        this.blocks.forEach((block) => {
            if (block.solid) {
                planes.push(...createBlockGeometry(block));
            }
        });

        // Update level geometry
        this.mesh.geometry.dispose();
        this.mesh.geometry = (() => {
            const geometry = new Geometry();
            planes.forEach((plane) => geometry.merge(plane));
            planes.forEach((plane) => plane.dispose());
            geometry.elementsNeedUpdate = true;
            return geometry;
        })();
    }

    private updateFloorGeometry() {
        const { width, depth } = this;
        this.floor.geometry.dispose();

        this.floor.geometry = new PlaneGeometry(width, depth, width, depth);
        this.floor.geometry.rotateX(-Math.PI / 2);
        this.floor.geometry.translate(-0.5, -0.5, -0.5);
        this.floor.geometry.translate(width / 2, 0, depth / 2);
    }
}
