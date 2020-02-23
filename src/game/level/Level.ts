import { Tiled2D } from "./Tiled2D";
import {
    Scene,
    PlaneGeometry,
    Mesh,
    Geometry,
    MeshBasicMaterial,
    Texture,
    TextureLoader,
    Vector2,
    NearestFilter,
    Color,
    VertexColors
} from "three";
import { clamp } from "lodash";
import { degToRad } from "../core/Utils";

export class Level {
    public readonly scene = new Scene();
    public readonly lightMap: Color[] = [];
    public rows = 0;
    public cols = 0;

    public load() {
        return Promise.all([
            fetch("/assets/tilemap.json").then(rsp => rsp.json()),
            fetch("/assets/tileset.json").then(rsp => rsp.json()),
            new Promise<Texture>(resolve => {
                new TextureLoader().load("/assets/tileset.png", resolve);
            })
        ]).then((data: [Tiled2D.Tilemap, Tiled2D.Tileset, Texture]) => {
            const [tilemap, tileset, texture] = data;

            this.scene.remove(...this.scene.children);
            this.rows = tilemap.height;
            this.cols = tilemap.width;

            this.buildLightMap(tilemap);
            this.buildMesh(tilemap, tileset, texture);
        });
    }

    public getLightColor(x: number, y: number) {
        const index = y * this.cols + x;
        return this.lightMap[index] || new Color(0x000000);
    }

    private buildMesh(
        tilemap: Tiled2D.Tilemap,
        tileset: Tiled2D.Tileset,
        texture: Texture
    ) {
        const setTextureUV = (cords: Vector2[][], tileId: number) => {
            // Initialize UV
            const tileU = tileset.tilewidth / tileset.imagewidth;
            const tileV = tileset.tileheight / tileset.imageheight;

            cords[0][0].set(0, 1);
            cords[0][1].set(0, 1 - tileV);
            cords[0][2].set(tileU, 1);

            cords[1][0].set(0, 1 - tileV);
            cords[1][1].set(tileU, 1 - tileV);
            cords[1][2].set(tileU, 1);

            // Offset by tileID
            let x = (tileId - 1) % tileset.columns;
            let y = Math.floor((tileId - 1) / tileset.columns);
            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < 3; j++) {
                    cords[i][j].x += tileU * x;
                    cords[i][j].y -= tileV * y;
                }
            }
        };

        const setVertexColor = (geo: Geometry, color: Color) => {
            const faceCount = 2;
            const vertsPerFace = 3;
            for (let i = 0; i < faceCount; i++) {
                for (let j = 0; j < vertsPerFace; j++) {
                    geo.faces[i].vertexColors[j] = color;
                }
            }
            geo.elementsNeedUpdate = true;
        };

        const createPlane = (tileId: number, color: Color) => {
            const plane = new PlaneGeometry(1, 1, 1, 1);
            setVertexColor(plane, color);
            setTextureUV(plane.faceVertexUvs[0], tileId);
            return plane;
        };

        const ceil = Tiled2D.getLayerTiles(tilemap, "Ceiling");
        const wall = Tiled2D.getLayerTiles(tilemap, "Wall");
        const floor = Tiled2D.getLayerTiles(tilemap, "Floor");

        const planes: PlaneGeometry[] = [];
        const getLight = this.getLightColor.bind(this);
        floor.forEach((_, index) => {
            const x = index % this.cols;
            const z = Math.floor(index / this.cols);
            const color = getLight(x, z);

            const ceilId = ceil[index];
            if (ceilId > 0) {
                const plane = createPlane(ceilId, color);
                plane.rotateX(degToRad(90));
                plane.translate(x, 0.5, z);
                planes.push(plane);
            }

            const floorId = floor[index];
            if (floorId > 0) {
                const plane = createPlane(floorId, color);
                plane.rotateX(degToRad(-90));
                plane.translate(x, -0.5, z);
                planes.push(plane);
            }

            const wallId = wall[index];
            if (wallId > 0) {
                // Front wall
                const frontWallIndex = (z + 1) * tilemap.width + x;
                if (!wall[frontWallIndex]) {
                    const frontWall = createPlane(wallId, getLight(x, z + 1));
                    frontWall.rotateY(degToRad(0));
                    frontWall.translate(x, 0, z + 0.5);
                    planes.push(frontWall);
                }

                // Back wall
                const backWallIndex = (z - 1) * tilemap.width + x;
                if (!wall[backWallIndex]) {
                    const backWall = createPlane(wallId, getLight(x, z - 1));
                    backWall.rotateY(degToRad(180));
                    backWall.translate(x, 0, z - 0.5);
                    planes.push(backWall);
                }

                // Right wall
                const rightWallIndex = z * tilemap.width + (x - 1);
                if (!wall[rightWallIndex]) {
                    const rightWall = createPlane(wallId, getLight(x - 1, z));
                    rightWall.rotateY(degToRad(-90));
                    rightWall.translate(x - 0.5, 0, z);
                    planes.push(rightWall);
                }

                // Left wall
                const leftWallIndex = z * tilemap.width + (x + 1);
                if (!wall[leftWallIndex]) {
                    const leftWall = createPlane(wallId, getLight(x + 1, z));
                    leftWall.rotateY(degToRad(90));
                    leftWall.translate(x + 0.5, 0, z);
                    planes.push(leftWall);
                }
            }
        });

        const geometry = new Geometry();
        planes.forEach(plane => geometry.merge(plane));
        planes.forEach(plane => plane.dispose());
        geometry.elementsNeedUpdate = true;

        const materal = new MeshBasicMaterial({
            vertexColors: VertexColors,
            map: texture
        });
        texture.minFilter = NearestFilter;
        texture.magFilter = NearestFilter;

        const levelMesh = new Mesh(geometry, materal);
        this.scene.add(levelMesh);
    }

    private buildLightMap(tilemap: Tiled2D.Tilemap) {
        const wallLayer = Tiled2D.getLayerTiles(tilemap, "Wall");
        const lightLayer = Tiled2D.getLayerTiles(tilemap, "Lights");

        const shadowColor = new Color(0x222222);
        const lightRad = 10;
        const lightStr = 0.75;

        // Fill all lights in the scene
        const lightData: Array<{ point: Vector2; color: Color }> = [];
        const lightColors = [
            new Color(0xffffff),
            new Color(0xff0000),
            new Color(0x00ff00),
            new Color(0x0000ff)
        ];
        lightLayer.forEach((lightId, index) => {
            if (lightId > 0) {
                const x = index % tilemap.width;
                const y = Math.floor(index / tilemap.width);
                lightData.push({
                    point: new Vector2(x, y),
                    color: lightColors[lightId - 1] || new Color(0xffffff)
                });
            }
        });

        // Build lightmap
        const lightMap: Color[] = lightLayer.map(_ => shadowColor.clone());
        for (let y = 0; y < tilemap.height; y++) {
            for (let x = 0; x < tilemap.width; x++) {
                const index = y * tilemap.width + x;
                if (wallLayer[index] > 0) {
                    continue; // Is in shadow
                }

                const color = lightMap[index];
                const tile = new Vector2(x, y);
                lightData.forEach(light => {
                    // Check wall collision
                    let reachedLight = false;

                    const direction = light.point
                        .clone()
                        .sub(tile)
                        .normalize();

                    const ray = tile.clone();
                    for (let i = 0; i < 24; i++) {
                        ray.x += direction.x;
                        ray.y += direction.y;

                        const rx = Math.round(ray.x);
                        const ry = Math.round(ray.y);
                        if (rx === light.point.x && ry === light.point.y) {
                            reachedLight = true;
                            break; // Reached the light
                        }

                        const rindex = ry * tilemap.width + rx;
                        if (wallLayer[rindex] > 0) {
                            break; // Hit the wall
                        }
                    }

                    if (reachedLight) {
                        let value = tile.distanceTo(light.point);
                        value = clamp(value, 0, lightRad);
                        value = (lightRad - value) / lightRad;
                        value = value * lightStr;
                        color.r += light.color.r * value;
                        color.g += light.color.g * value;
                        color.b += light.color.b * value;
                    }
                });
            }
        }

        // Soft shadows
        const lightMapClone = lightMap.map(color => new Color(color));
        lightMapClone.forEach((color, index) => {
            if (color.getHex() !== shadowColor.getHex()) {
                return;
            }

            const x = index % tilemap.width;
            const y = Math.floor(index / tilemap.width);

            const shadowCell = lightMap[index];
            for (let y1 = y - 1; y1 <= y + 1; y1++) {
                for (let x1 = x - 1; x1 <= x + 1; x1++) {
                    const index = y1 * tilemap.width + x1;
                    const color = lightMapClone[index];
                    if (color === undefined) continue;
                    if (color.getHex() === shadowColor.getHex()) continue;
                    shadowCell.r += color.r / 16;
                    shadowCell.g += color.g / 16;
                    shadowCell.b += color.b / 16;
                }
            }
        });

        // Store new light map
        this.lightMap.length = 0;
        this.lightMap.push(...lightMap);

        // Render
        const renderDebug = true;
        if (!renderDebug) return;

        const canvas = document.createElement("canvas");
        const tilesize = 8;
        const padding = 0;
        canvas.width = tilesize * this.cols;
        canvas.height = tilesize * this.rows;
        canvas.style.position = "absolute";
        document.body.appendChild(canvas);

        const ctx = canvas.getContext("2d");
        if (ctx !== null) {
            const fillTile = (x: number, y: number, color: string) => {
                ctx.fillStyle = color;
                ctx.fillRect(
                    x * tilesize,
                    y * tilesize,
                    tilesize - padding,
                    tilesize - padding
                );
            };

            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, 512, 512);

            for (let y = 0; y < tilemap.height; y++) {
                for (let x = 0; x < tilemap.width; x++) {
                    const index = y * tilemap.width + x;

                    const light = lightMap[index].clone();
                    light.r = clamp(light.r, 0, 1);
                    light.g = clamp(light.g, 0, 1);
                    light.b = clamp(light.b, 0, 1);
                    fillTile(x, y, "#" + light.getHexString());

                    const wallId = wallLayer[index];
                    if (wallId > 0) {
                        fillTile(x, y, "#008888");
                    }

                    const lightId = lightLayer[index];
                    if (lightId > 0) {
                        fillTile(x, y, "#aa2222");
                    }
                }
            }
        }
    }
}
