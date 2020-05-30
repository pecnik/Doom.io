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
    BackSide,
    BoxGeometry,
    Ray,
    Group,
    IcosahedronGeometry,
    CylinderGeometry,
} from "three";
import { disposeMeshMaterial, loadTexture } from "../game/Helpers";
import { degToRad } from "../game/core/Utils";
import { clamp, isEqual } from "lodash";

export const TILE_W = 64;
export const TILE_H = 64;
export const TEXTURE_W = 512;
export const TEXTURE_H = 512;
export const TILE_COLS = Math.floor(TEXTURE_W / TILE_W);
export const TILE_ROWS = Math.floor(TEXTURE_H / TILE_H);

export interface LevelJSON {
    width: number;
    height: number;
    depth: number;
    skins: number[][];
    blocks: number[];
    solidBlocks: number[];
    jumpPadBlocks: { index: number; force: number }[];
    emmitionBlocks: { index: number; color: number }[];
}

export class LevelBlock {
    public readonly index: number;
    public readonly origin: Vector3;
    public readonly aabb: Box3;

    public faces = [0, 0, 0, 0, 0, 0].map((x) => x + 16);
    public solid = false;
    public emit = false;
    public jumpPadForce = 0;
    public light = new Color();

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
        this.light.copy(block.light);
        this.faces = block.faces.concat([]);
        this.solid = block.solid;
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

    public readonly meshMesh = new Mesh();
    public readonly skyboxMesh = new Mesh();
    public readonly lightMeshGroup = new Group();
    public readonly jumpPadMeshGroup = new Group();
    public readonly floorMesh = this.createFloorMesh();
    public readonly wireframeMesh = this.createWireframeMesh();

    private createFloorMesh() {
        return new Mesh(
            new PlaneGeometry(),
            new MeshBasicMaterial({
                transparent: true,
                wireframe: true,
                opacity: 0.25,
                color: 0xffffff,
            })
        );
    }

    private createWireframeMesh() {
        return new Mesh(
            new Geometry(),
            new MeshBasicMaterial({
                color: 0x00ff00,
                wireframe: true,
                transparent: true,
                opacity: 0.5,
            })
        );
    }

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

    public getLights() {
        interface Light {
            origin: Vector3;
            color: Color;
        }

        const lights: Light[] = [];
        this.blocks.forEach((block) => {
            if (block.emit) {
                lights.push({
                    origin: block.origin.clone(),
                    color: block.light.clone(),
                });
            }
        });

        return lights;
    }

    public getJumpPads() {
        interface JumpPad {
            origin: Vector3;
            force: number;
        }

        const jumpPads: JumpPad[] = [];
        this.blocks.forEach((block) => {
            if (block.jumpPadForce > 0) {
                jumpPads.push({
                    origin: block.origin.clone(),
                    force: block.jumpPadForce,
                });
            }
        });

        return jumpPads;
    }

    public loadMaterial() {
        return loadTexture("/assets/tileset.png").then((map) => {
            disposeMeshMaterial(this.meshMesh.material);
            this.meshMesh.material = new MeshBasicMaterial({
                vertexColors: VertexColors,
                map,
            });
        });
    }

    public loadSkybox() {
        const loadMaterial = (src: string) => {
            return loadTexture(src).then((map) => {
                return new MeshBasicMaterial({ map, side: BackSide });
            });
        };

        return Promise.all([
            loadMaterial("/assets/skybox/hell_ft.png"),
            loadMaterial("/assets/skybox/hell_bk.png"),

            loadMaterial("/assets/skybox/hell_up.png"),
            loadMaterial("/assets/skybox/hell_dn.png"),

            loadMaterial("/assets/skybox/hell_rt.png"),
            loadMaterial("/assets/skybox/hell_lf.png"),
        ]).then((materials) => {
            const geometry = new BoxGeometry(512, 512, 512);
            geometry.rotateY(degToRad(45));

            const skybox = new Mesh(geometry, materials);
            this.skyboxMesh.add(skybox);
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
        this.updateJumpPadMeshGroup();
        this.updateLightMeshGroup();
        this.updateFloorMesh();
        this.wireframeMesh.geometry.dispose();
        this.wireframeMesh.geometry = this.meshMesh.geometry.clone();
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
        this.meshMesh.geometry.dispose();
        this.meshMesh.geometry = (() => {
            const geometry = new Geometry();
            planes.forEach((plane) => geometry.merge(plane));
            planes.forEach((plane) => plane.dispose());
            geometry.elementsNeedUpdate = true;
            return geometry;
        })();
    }

    private updateFloorMesh() {
        const { width, depth } = this;
        this.floorMesh.geometry.dispose();

        this.floorMesh.geometry = new PlaneGeometry(width, depth, width, depth);
        this.floorMesh.geometry.rotateX(-Math.PI / 2);
        this.floorMesh.geometry.translate(-0.5, -0.5, -0.5);
        this.floorMesh.geometry.translate(width / 2, 0, depth / 2);
    }

    private lightMeshGeo = new IcosahedronGeometry(0.5);
    private updateLightMeshGroup() {
        const lights = this.getLights();

        for (let i = 0; i < lights.length; i++) {
            const light = lights[i];
            let mesh = this.lightMeshGroup.children[i] as Mesh;
            if (mesh === undefined) {
                mesh = new Mesh(this.lightMeshGeo);
                this.lightMeshGroup.add(mesh);
            }

            mesh.visible = true;
            mesh.position.copy(light.origin);
            (mesh.material as MeshBasicMaterial).color.copy(light.color);
        }

        // Hide rememain light meshes
        for (
            let i = lights.length;
            i < this.lightMeshGroup.children.length;
            i++
        ) {
            this.lightMeshGroup.children[i].visible = false;
        }
    }

    private jumpPadMeshGeo = new CylinderGeometry(0.4, 0.4, 0.8, 8, 1, true);
    private jumpPadMeshMat = new MeshBasicMaterial({
        color: 0xc00bcff,
        wireframe: true,
    });
    private updateJumpPadMeshGroup() {
        const jumpPads = this.getJumpPads();

        let count = 0;
        jumpPads.forEach((jumpPad) => {
            for (let i = 0; i < jumpPad.force; i++) {
                let mesh = this.jumpPadMeshGroup.children[count];
                if (mesh === undefined) {
                    mesh = new Mesh(this.jumpPadMeshGeo, this.jumpPadMeshMat);
                    this.jumpPadMeshGroup.add(mesh);
                    console.log("New jump pad");
                }

                mesh.visible = true;
                mesh.position.copy(jumpPad.origin);
                mesh.position.y += i;

                count++;
            }
        });

        // Hide rememain jump pad meshes
        for (let i = count; i < this.jumpPadMeshGroup.children.length; i++) {
            this.jumpPadMeshGroup.children[i].visible = false;
        }
    }

    public updateGeometryLightning() {
        const lights = this.getLights();

        const ray = new Ray();
        const areaBox = new Box3();
        const blockBox = new Box3();

        const reachedLight = (point: Vector3, light: Vector3) => {
            ray.origin.copy(point);
            ray.direction.subVectors(light, point).normalize();

            const pad = 0.001;
            areaBox.min.set(
                Math.min(point.x, light.x) - pad,
                Math.min(point.y, light.y) - pad,
                Math.min(point.z, light.z) - pad
            );

            areaBox.max.set(
                Math.max(point.x, light.x) + pad,
                Math.max(point.y, light.y) + pad,
                Math.max(point.z, light.z) + pad
            );

            for (let i = 0; i < this.blocks.length; i++) {
                const block = this.blocks[i];
                if (!block.solid) continue;
                if (!areaBox.intersectsBox(block.aabb)) continue;

                blockBox.copy(block.aabb);
                blockBox.min.addScalar(pad);
                blockBox.max.subScalar(pad);
                if (ray.intersectsBox(blockBox)) {
                    return false;
                }
            }

            return true;
        };

        const aggregateLight = (point: Vector3, normal: Vector3) => {
            const result = new Color(0.2, 0.2, 0.3);

            for (let l = 0; l < lights.length; l++) {
                const light = lights[l].origin;
                const color = lights[l].color;

                // Test if facing light
                if (normal.x === +1 && light.x < point.x) continue;
                if (normal.x === -1 && light.x > point.x) continue;
                if (normal.y === +1 && light.y < point.y) continue;
                if (normal.y === -1 && light.y > point.y) continue;
                if (normal.z === +1 && light.z < point.z) continue;
                if (normal.z === -1 && light.z > point.z) continue;

                // Test if point reaches
                if (reachedLight(point, light)) {
                    const lightRad = 16; // TODO - export as light prop
                    const lightStr = 1.5; // TODO - export as light prop

                    let value = point.distanceTo(light);
                    value = (lightRad - value) / lightRad;
                    value = clamp(value, 0, 1) * lightStr;

                    result.r += color.r * value;
                    result.g += color.g * value;
                    result.b += color.b * value;
                }
            }

            return result;
        };

        const geometry = this.meshMesh.geometry as Geometry;
        geometry.elementsNeedUpdate = true;
        for (let i = 0; i < geometry.faces.length; i++) {
            const face = geometry.faces[i];
            const verts = geometry.vertices;
            face.vertexColors[0] = aggregateLight(verts[face.a], face.normal);
            face.vertexColors[1] = aggregateLight(verts[face.b], face.normal);
            face.vertexColors[2] = aggregateLight(verts[face.c], face.normal);
        }
    }

    public updateAmbientOcclusion() {
        const occlusion = (color: Color, vec: Vector3) => {
            const xmin = Math.min(vec.x - 0.5);
            const ymin = Math.min(vec.y - 0.5);
            const zmin = Math.min(vec.z - 0.5);

            const xmax = Math.max(vec.x + 0.5);
            const ymax = Math.max(vec.y + 0.5);
            const zmax = Math.max(vec.z + 0.5);

            let count = 0;
            for (let x = xmin; x <= xmax; x++) {
                for (let y = ymin; y <= ymax; y++) {
                    for (let z = zmin; z <= zmax; z++) {
                        const block = this.getBlock(x, y, z);
                        if (block && block.solid) {
                            count++;
                        }
                    }
                }
            }

            if (count > 4) {
                color.r *= 0.5;
                color.g *= 0.5;
                color.b *= 0.5;
            }
        };

        const geometry = this.meshMesh.geometry as Geometry;
        geometry.elementsNeedUpdate = true;
        for (let i = 0; i < geometry.faces.length; i++) {
            const face = geometry.faces[i];
            const verts = geometry.vertices;
            occlusion(face.vertexColors[0], verts[face.a]);
            occlusion(face.vertexColors[1], verts[face.b]);
            occlusion(face.vertexColors[2], verts[face.c]);
        }
    }

    public readJson(json: LevelJSON) {
        this.resize(json.width, json.height, json.depth);

        // Apply the block skins, event to the invisible blocks
        this.blocks.forEach((block, blockIndex) => {
            const skinIndex = json.blocks[blockIndex];
            const skin = json.skins[skinIndex];
            block.faces.length = 0;
            block.faces.push(...skin);
        });

        json.solidBlocks.forEach((index) => {
            const block = this.blocks[index];
            block.solid = true;
        });

        json.emmitionBlocks.forEach((data) => {
            const block = this.blocks[data.index];
            block.emit = true;
            block.light.setHex(data.color);
        });

        json.jumpPadBlocks.forEach((data) => {
            const block = this.blocks[data.index];
            block.jumpPadForce = data.force;
        });
    }

    public toJSON(): LevelJSON {
        const json: LevelJSON = {
            width: this.width,
            height: this.height,
            depth: this.depth,
            skins: [],
            blocks: [],
            solidBlocks: [],
            jumpPadBlocks: [],
            emmitionBlocks: [],
        };

        const getSkinIndex = (block: LevelBlock): number => {
            for (let i = 0; i < json.skins.length; i++) {
                if (isEqual(json.skins[i], block.faces)) {
                    return i;
                }
            }
            json.skins.push([...block.faces]);
            return json.skins.length - 1;
        };

        this.blocks.forEach((block) => {
            json.blocks.push(getSkinIndex(block));

            if (block.solid) {
                json.solidBlocks.push(block.index);
            }

            if (block.emit) {
                json.emmitionBlocks.push({
                    index: block.index,
                    color: block.light.getHex(),
                });
            }

            if (block.jumpPadForce > 0) {
                json.jumpPadBlocks.push({
                    index: block.index,
                    force: block.jumpPadForce,
                });
            }
        });

        return json;
    }
}
