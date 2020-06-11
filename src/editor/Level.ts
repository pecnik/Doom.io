import {
    Mesh,
    Vector3,
    Color,
    Box3,
    PlaneGeometry,
    MeshBasicMaterial,
    Geometry,
    BackSide,
    BoxGeometry,
    Group,
    IcosahedronGeometry,
    CylinderGeometry,
    NearestFilter,
    Vector2,
    VertexColors,
    Ray,
} from "three";
import { loadTexture } from "../game/Helpers";
import { degToRad, modulo } from "../game/core/Utils";
import { clamp, isEqual } from "lodash";

export const TILE_W = 64;
export const TILE_H = 64;
export const TEXTURE_W = 512;
export const TEXTURE_H = 512;
export const TILE_COLS = Math.floor(TEXTURE_W / TILE_W);
export const TILE_ROWS = Math.floor(TEXTURE_H / TILE_H);

export interface LevelTextureJSON {
    src: string;
    scale: number;
}

export interface LevelJSON {
    width: number;
    height: number;
    depth: number;
    skins: number[][];
    blocks: number[];
    textures: LevelTextureJSON[];
    solidBlocks: number[];
    jumpPadBlocks: { index: number; force: number }[];
    emmitionBlocks: {
        index: number;
        color: number;
        str: number;
        rad: number;
    }[];
}

export interface LevelTexture {
    src: string;
    scale: number;
    material: MeshBasicMaterial;
}

export class LevelBlock {
    public readonly index: number;
    public readonly origin: Vector3;
    public readonly aabb: Box3;

    public faces = [0, 0, 0, 0, 0, 0];
    public solid = false;

    public lightStr = 0;
    public lightRad = 0;
    public lightColor = new Color();

    public jumpPadForce = 0;

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
        this.solid = block.solid;
        this.lightStr = block.lightStr;
        this.lightRad = block.lightRad;
        this.jumpPadForce = block.jumpPadForce;
        this.lightColor.copy(block.lightColor);
        Object.assign(this.faces, block.faces);
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
    public static Texture(src: string, scale = 0) {
        return {
            src,
            scale,
            material: new MeshBasicMaterial({ vertexColors: VertexColors }),
        };
    }

    public width = 0;
    public height = 0;
    public depth = 0;
    public blocks: LevelBlock[] = [];
    public textures: LevelTexture[] = [
        Level.Texture("/assets/levels/textures/brick.png"),
        Level.Texture("/assets/levels/textures/metal_1.png"),
        Level.Texture("/assets/levels/textures/metal_2.png"),
        Level.Texture("/assets/levels/textures/floor_tile.png"),
    ];

    public readonly mesh = new Group();
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

    public isBlockSolid(x: number, y: number, z: number) {
        const block = this.getBlock(x, y, z);
        return block !== undefined && block.solid;
    }

    public isBlockSolidAt(vec: Vector3) {
        return this.isBlockSolid(
            Math.round(vec.x),
            Math.round(vec.y),
            Math.round(vec.z)
        );
    }

    public getBlockLight(x: number, y: number, z: number) {
        const block = this.getBlock(
            clamp(x, 0, this.width - 1),
            clamp(y, 0, this.height - 1),
            clamp(z, 0, this.depth - 1)
        ) as LevelBlock;
        return block.lightColor;
    }

    public getBlockLightAt(vec: Vector3) {
        return this.getBlockLight(
            Math.round(vec.x),
            Math.round(vec.y),
            Math.round(vec.z)
        );
    }

    public getLights() {
        interface Light {
            origin: Vector3;
            color: Color;
            str: number;
            rad: number;
        }

        const lights: Light[] = [];
        this.blocks.forEach((block) => {
            if (block.lightStr > 0) {
                lights.push({
                    origin: block.origin.clone(),
                    color: block.lightColor.clone(),
                    str: block.lightStr,
                    rad: block.lightRad,
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

    public getSpawnPoints() {
        const floorBlocks = this.blocks.filter((block) => {
            const rad = 1;
            const minx = block.origin.x - rad;
            const maxx = block.origin.x + rad;
            const minz = block.origin.z - rad;
            const maxz = block.origin.z + rad;

            const y = block.origin.y;
            for (let x = minx; x <= maxx; x++) {
                for (let z = minz; z < maxz; z++) {
                    const bot = this.isBlockSolid(x, y - 1, z);
                    if (!bot) return false;

                    const top = this.isBlockSolid(x, y + 1, z);
                    const mid = this.isBlockSolid(x, y, z);
                    if (top) return false;
                    if (mid) return false;
                }
            }

            return true;
        });

        return floorBlocks.map((block) => block.origin);
    }

    public loadMaterial() {
        const loadTextureMaterial = (texture: LevelTexture) => {
            return loadTexture(texture.src).then((map) => {
                map.needsUpdate = true;
                map.magFilter = NearestFilter;
                texture.material.map = map;
                texture.material.needsUpdate = true;
            });
        };

        return Promise.all(this.textures.map(loadTextureMaterial));
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
        this.wireframeMesh.geometry = (() => {
            const wireframeGeo = new Geometry();
            this.mesh.children.forEach((child) => {
                const mesh = child as Mesh;
                wireframeGeo.merge(mesh.geometry as Geometry);
            });
            return wireframeGeo;
        })();
    }

    private updateMeshGeometry() {
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

        const setTextureUV = (
            plane: PlaneGeometry,
            textureId: number,
            x: number = 0,
            y: number = 0
        ) => {
            plane.elementsNeedUpdate = true;

            // Set texture tiling
            const pow = this.textures[textureId]
                ? this.textures[textureId].scale
                : 0;
            const scale = 2 ** pow;

            const tileW = 1 / scale;
            const tileH = 1 / scale;

            const minU = 0;
            const maxU = tileW;
            const maxV = 1;
            const minV = 1 - tileH;

            const cords: Vector2[][] = plane.faceVertexUvs[0];
            cords[0][0].set(minU, maxV);
            cords[0][1].set(minU, minV);
            cords[0][2].set(maxU, maxV);

            cords[1][0].set(minU, minV);
            cords[1][1].set(maxU, minV);
            cords[1][2].set(maxU, maxV);

            x = modulo(x, scale);
            y = modulo(y, scale);
            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < 3; j++) {
                    cords[i][j].x += tileW * x;
                    cords[i][j].y -= tileH * y;
                }
            }
        };

        /**
         * Create planes for each texture material.
         */
        const texturePlanes: PlaneGeometry[][] = [];
        this.textures.forEach((_, textureId) => {
            texturePlanes[textureId] = [];
        });

        const planesOf = (textureId: number) => {
            if (texturePlanes[textureId] === undefined) {
                for (let i = 0; i <= textureId; i++) {
                    if (texturePlanes[i] === undefined) {
                        texturePlanes[i] = [];
                    }
                }
            }
            return texturePlanes[textureId];
        };

        const emptryMaterial = new MeshBasicMaterial({ color: 0xff00ff });
        const materialOf = (textureId: number) => {
            if (this.textures[textureId] === undefined) {
                return emptryMaterial;
            }
            return this.textures[textureId].material;
        };

        /**
         * Loop through each solid block.
         * Create optimized geometry by only creating
         * block planes that are visible.
         */
        this.blocks.forEach((block) => {
            if (!block.solid) return;

            const { origin } = block;

            const hasSolidNeighbor = (x: number, y: number, z: number) => {
                const neighbor = this.getBlock(
                    origin.x + x,
                    origin.y + y,
                    origin.z + z
                );
                return neighbor !== undefined && neighbor.solid;
            };

            if (!hasSolidNeighbor(-1, 0, 0) && origin.x > 0) {
                const xmin = new PlaneGeometry(1, 1, 1, 1);
                const textureId = block.faces[0];
                setTextureUV(xmin, textureId, origin.z, -origin.y);
                setVertexColor(xmin, bright1);
                xmin.rotateY(Math.PI * -0.5);
                xmin.translate(origin.x, origin.y, origin.z);
                xmin.translate(-0.5, 0, 0);
                planesOf(textureId).push(xmin);
            }

            if (!hasSolidNeighbor(1, 0, 0) && origin.x < this.width - 1) {
                const xmax = new PlaneGeometry(1, 1, 1, 1);
                const textureId = block.faces[1];
                setTextureUV(xmax, textureId, -origin.z, -origin.y);
                setVertexColor(xmax, bright1);
                xmax.rotateY(Math.PI * 0.5);
                xmax.translate(origin.x, origin.y, origin.z);
                xmax.translate(0.5, 0, 0);
                planesOf(textureId).push(xmax);
            }

            if (!hasSolidNeighbor(0, -1, 0) && origin.y > 0) {
                const ymin = new PlaneGeometry(1, 1, 1, 1);
                const textureId = block.faces[2];
                setTextureUV(ymin, textureId, origin.x, -origin.z);
                setVertexColor(ymin, dark2);
                ymin.rotateX(Math.PI * 0.5);
                ymin.translate(origin.x, origin.y, origin.z);
                ymin.translate(0, -0.5, 0);
                planesOf(textureId).push(ymin);
            }

            if (!hasSolidNeighbor(0, 1, 0)) {
                const ymax = new PlaneGeometry(1, 1, 1, 1);
                const textureId = block.faces[3];
                setTextureUV(ymax, textureId, origin.x, origin.z);
                setVertexColor(ymax, bright2);
                ymax.rotateX(Math.PI * -0.5);
                ymax.translate(origin.x, origin.y, origin.z);
                ymax.translate(0, 0.5, 0);
                planesOf(textureId).push(ymax);
            }

            if (!hasSolidNeighbor(0, 0, -1) && origin.z > 0) {
                const zmin = new PlaneGeometry(1, 1, 1, 1);
                const textureId = block.faces[4];
                setTextureUV(zmin, textureId, origin.x, -origin.y);
                setVertexColor(zmin, dark1);
                zmin.rotateY(Math.PI);
                zmin.translate(origin.x, origin.y, origin.z);
                zmin.translate(0, 0, -0.5);
                planesOf(textureId).push(zmin);
            }

            if (!hasSolidNeighbor(0, 0, 1) && origin.z < this.depth - 1) {
                const zmax = new PlaneGeometry(1, 1, 1, 1);
                const textureId = block.faces[5];
                setTextureUV(zmax, textureId, -origin.x, -origin.y);
                setVertexColor(zmax, dark1);
                zmax.translate(origin.x, origin.y, origin.z);
                zmax.translate(0, 0, 0.5);
                planesOf(textureId).push(zmax);
            }
        });

        /**
         * Hide and dispose old mesh geometry.
         */
        this.mesh.children.forEach((child) => {
            const mesh = child as Mesh;
            mesh.visible = false;
            mesh.geometry.dispose();
        });

        /**
         * Build one mesh for each texture material.
         * So there will be only 1 draw call per texture type.
         */
        texturePlanes.forEach((planes, textureId) => {
            const material = materialOf(textureId);
            const geometry = new Geometry();
            planes.forEach((plane) => geometry.merge(plane));
            planes.forEach((plane) => plane.dispose());
            geometry.mergeVertices();
            geometry.elementsNeedUpdate = true;

            let mesh = this.mesh.children[textureId] as Mesh;
            if (mesh === undefined) {
                mesh = new Mesh(new Geometry(), material);
                this.mesh.add(mesh);
            }

            mesh.visible = planes.length > 0;
            mesh.geometry = geometry;
        });
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
        if (lights.length === 0) return Promise.resolve();

        const ray = new Ray();
        const blockBox = new Box3();
        const reachedLight = (point: Vector3, light: Vector3) => {
            ray.origin.copy(point);
            ray.direction.subVectors(light, point).normalize();

            const step = ray.direction.clone().multiplyScalar(0.2);
            const bray = point.clone().add(step);
            while (bray.distanceToSquared(light) > 1) {
                const block = this.getBlockAt(bray);
                if (block && block.solid) {
                    const pad = 0.001;
                    blockBox.copy(block.aabb);
                    blockBox.min.addScalar(pad);
                    blockBox.max.subScalar(pad);
                    if (ray.intersectsBox(blockBox)) {
                        return false;
                    }
                }

                bray.add(step);
            }

            return true;
        };

        const aggregateLight = (point: Vector3, normal: Vector3) => {
            const result = new Color(0.25, 0.25, 0.25);

            for (let l = 0; l < lights.length; l++) {
                const lightOrigin = lights[l].origin;
                const lightColor = lights[l].color;
                const lightRad = lights[l].rad;
                const lightStr = lights[l].str;

                // Quick dist check
                const distSqrt = point.distanceToSquared(lightOrigin);
                const lightRadSqrt = lightRad ** 2;
                if (distSqrt > lightRadSqrt) continue;

                // Test if facing light
                if (normal.x === +1 && lightOrigin.x < point.x) continue;
                if (normal.x === -1 && lightOrigin.x > point.x) continue;
                if (normal.y === +1 && lightOrigin.y < point.y) continue;
                if (normal.y === -1 && lightOrigin.y > point.y) continue;
                if (normal.z === +1 && lightOrigin.z < point.z) continue;
                if (normal.z === -1 && lightOrigin.z > point.z) continue;

                // Test if point reaches
                if (reachedLight(point, lightOrigin)) {
                    const dist = point.distanceTo(lightOrigin);
                    let value = (lightRad - dist) / lightRad;
                    value = clamp(value, 0, 1) * lightStr;

                    result.r += lightColor.r * value;
                    result.g += lightColor.g * value;
                    result.b += lightColor.b * value;
                }
            }

            return result;
        };

        const updateMesh = (mesh: Mesh) => {
            return new Promise((resolve, reject) => {
                const geometry = mesh.geometry as Geometry;

                let index = 0;
                const updateFace = () => {
                    if (geometry !== mesh.geometry) return reject();
                    if (geometry.faces.length <= index) return resolve();

                    const { faces, vertices } = geometry;
                    for (let i = 0; i < 100 && index < faces.length; i++) {
                        const f = faces[index];
                        const v = vertices;
                        f.vertexColors[0] = aggregateLight(v[f.a], f.normal);
                        f.vertexColors[1] = aggregateLight(v[f.b], f.normal);
                        f.vertexColors[2] = aggregateLight(v[f.c], f.normal);
                        index++;
                    }

                    geometry.elementsNeedUpdate = true;

                    setTimeout(updateFace);
                };

                updateFace();
            });
        };

        return Promise.all(
            this.mesh.children.map((child) => {
                const mesh = child as Mesh;
                return updateMesh(mesh);
            })
        );
    }

    public updateAmbientOcclusion() {
        const occlusion = (color: Color, vec: Vector3, normal: Vector3) => {
            const xmin = Math.min(vec.x - 0.5);
            const ymin = Math.min(vec.y - 0.5);
            const zmin = Math.min(vec.z - 0.5);

            const xmax = Math.max(vec.x + 0.5);
            const ymax = Math.max(vec.y + 0.5);
            const zmax = Math.max(vec.z + 0.5);

            const point = vec.clone();
            point.x += normal.x * 0.5;
            point.y += normal.y * 0.5;
            point.z += normal.z * 0.5;

            let count = 0;
            for (let x = xmin; x <= xmax; x++) {
                for (let y = ymin; y <= ymax; y++) {
                    for (let z = zmin; z <= zmax; z++) {
                        const block = this.getBlock(x, y, z);
                        if (block === undefined) continue;
                        if (block.solid === false) continue;

                        if (
                            block.origin.x === point.x ||
                            block.origin.y === point.y ||
                            block.origin.z === point.z
                        ) {
                            count++;
                        }
                    }
                }
            }

            const str = 0.6;
            let fac = 1 / (count + 1);
            fac = 1 - str + 1 * str * fac;
            color.r *= fac;
            color.g *= fac;
            color.b *= fac;
        };

        this.mesh.children.forEach((child) => {
            const mesh = child as Mesh;
            const geometry = mesh.geometry as Geometry;
            geometry.elementsNeedUpdate = true;
            for (let i = 0; i < geometry.faces.length; i++) {
                const face = geometry.faces[i];
                const verts = geometry.vertices;
                occlusion(face.vertexColors[0], verts[face.a], face.normal);
                occlusion(face.vertexColors[1], verts[face.b], face.normal);
                occlusion(face.vertexColors[2], verts[face.c], face.normal);
            }
        });
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
            block.lightStr = data.str;
            block.lightRad = data.rad;
            block.lightColor.setHex(data.color);
        });

        json.jumpPadBlocks.forEach((data) => {
            const block = this.blocks[data.index];
            block.jumpPadForce = data.force;
        });

        if (json.textures) {
            this.textures.forEach((texture) => texture.material.dispose());
            this.textures = json.textures.map((json) => {
                return Level.Texture(json.src, json.scale);
            });
        }
    }

    public toJson(): LevelJSON {
        const json: LevelJSON = {
            width: this.width,
            height: this.height,
            depth: this.depth,
            skins: [],
            blocks: [],
            textures: this.textures.map((texture) => {
                return { src: texture.src, scale: texture.scale };
            }),
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

            if (block.lightStr > 0) {
                json.emmitionBlocks.push({
                    index: block.index,
                    color: block.lightColor.getHex(),
                    str: block.lightStr,
                    rad: block.lightRad,
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
