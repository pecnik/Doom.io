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
import { times, clamp } from "lodash";
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
            this.buildLightMap(tilemap);
            this.buildMesh(tilemap, tileset, texture);
        });
    }

    private buildMesh(
        tilemap: Tiled2D.Tilemap,
        tileset: Tiled2D.Tileset,
        texture: Texture
    ) {
        this.scene.remove(...this.scene.children);

        this.rows = tilemap.height;
        this.cols = tilemap.width;

        const findLayer = (name: string): number[] | undefined => {
            for (let i = 0; i < tilemap.layers.length; i++) {
                const layer = tilemap.layers[i];
                if (layer.name === name && layer.type === "tilelayer") {
                    return layer.data;
                }
            }
            return times(tilemap.width * tilemap.height).map(() => 0);
        };

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

        const planes: PlaneGeometry[] = [];

        const ceil = findLayer("Ceiling");
        const wall = findLayer("Wall");
        const floor = findLayer("Floor");

        const lights = findLayer("Lights");
        const lightPonts: Vector2[] = [];
        if (lights !== undefined) {
            for (let z = 0; z < this.rows; z++) {
                for (let x = 0; x < this.cols; x++) {
                    const index = z * tilemap.width + x;
                    if (lights[index] > 0) {
                        lightPonts.push(new Vector2(x, z));
                    }
                }
            }
        }

        const getLightColor = (x: number, y: number) => {
            const index = y * tilemap.width + x;
            return this.lightMap[index] || new Color(0x000000);
        };

        for (let z = 0; z < this.rows; z++) {
            for (let x = 0; x < this.cols; x++) {
                const index = z * tilemap.width + x;

                let color = getLightColor(x, z);

                if (ceil !== undefined) {
                    const tileId = ceil[index];
                    if (tileId > 0) {
                        const plane = new PlaneGeometry(1, 1, 1, 1);
                        setVertexColor(plane, color);
                        setTextureUV(plane.faceVertexUvs[0], tileId);
                        plane.rotateX(degToRad(90));
                        plane.translate(x, 0.5, z);
                        planes.push(plane);
                    }
                }

                if (floor !== undefined) {
                    const tileId = floor[index];
                    if (tileId > 0) {
                        const plane = new PlaneGeometry(1, 1, 1, 1);
                        setVertexColor(plane, color);
                        setVertexColor(plane, color);
                        setTextureUV(plane.faceVertexUvs[0], tileId);
                        plane.rotateX(degToRad(-90));
                        plane.translate(x, -0.5, z);
                        planes.push(plane);
                    }
                }

                if (wall !== undefined) {
                    const tileId = wall[index];
                    if (tileId > 0) {
                        // Front wall
                        const frontWallIndex = (z + 1) * tilemap.width + x;
                        if (!wall[frontWallIndex]) {
                            const frontWall = new PlaneGeometry(1, 1, 1, 1);
                            setVertexColor(frontWall, getLightColor(x, z + 1));
                            setTextureUV(frontWall.faceVertexUvs[0], tileId);
                            frontWall.rotateY(degToRad(0));
                            frontWall.translate(x, 0, z + 0.5);
                            planes.push(frontWall);
                        }

                        // Back wall
                        const backWallIndex = (z - 1) * tilemap.width + x;
                        if (!wall[backWallIndex]) {
                            const backWall = new PlaneGeometry(1, 1, 1, 1);
                            setVertexColor(backWall, getLightColor(x, z - 1));
                            setTextureUV(backWall.faceVertexUvs[0], tileId);
                            backWall.rotateY(degToRad(180));
                            backWall.translate(x, 0, z - 0.5);
                            planes.push(backWall);
                        }

                        // Right wall
                        const rightWallIndex = z * tilemap.width + (x - 1);
                        if (!wall[rightWallIndex]) {
                            const rightWall = new PlaneGeometry(1, 1, 1, 1);
                            setVertexColor(rightWall, getLightColor(x - 1, z));
                            setTextureUV(rightWall.faceVertexUvs[0], tileId);
                            rightWall.rotateY(degToRad(-90));
                            rightWall.translate(x - 0.5, 0, z);
                            planes.push(rightWall);
                        }

                        // Left wall
                        const leftWallIndex = z * tilemap.width + (x + 1);
                        if (!wall[leftWallIndex]) {
                            const leftWall = new PlaneGeometry(1, 1, 1, 1);
                            setVertexColor(leftWall, getLightColor(x + 1, z));
                            setTextureUV(leftWall.faceVertexUvs[0], tileId);
                            leftWall.rotateY(degToRad(90));
                            leftWall.translate(x + 0.5, 0, z);
                            planes.push(leftWall);
                        }
                    }
                }
            }
        }

        const geometry = new Geometry();
        planes.forEach(plane => {
            geometry.merge(plane);
            plane.dispose();
        });
        geometry.elementsNeedUpdate = true;

        const materal = new MeshBasicMaterial({
            vertexColors: VertexColors,
            map: texture
        });
        texture.minFilter = NearestFilter;
        texture.magFilter = NearestFilter;

        const mesh = new Mesh(geometry, materal);
        this.scene.add(mesh);
    }

    private buildLightMap(tilemap: Tiled2D.Tilemap) {
        const wallLayer = Tiled2D.getLayerTiles(tilemap, "Wall");
        const lightLayer = Tiled2D.getLayerTiles(tilemap, "Lights");

        // Fill all lights in the scene
        const lightPoints: Vector2[] = [];
        lightLayer.forEach((lightId, index) => {
            if (lightId > 0) {
                const x = index % tilemap.width;
                const y = Math.floor(index / tilemap.width);
                lightPoints.push(new Vector2(x, y));
            }
        });

        // Build lightmap
        const lightMap: Color[] = lightLayer.map(_ => new Color(0x222222));
        for (let y = 0; y < tilemap.height; y++) {
            for (let x = 0; x < tilemap.width; x++) {
                const index = y * tilemap.width + x;
                const color = lightMap[index];
                const tile = new Vector2(x, y);
                lightPoints.forEach(light => {
                    // Check wall collision
                    const direction = light
                        .clone()
                        .sub(tile)
                        .normalize();

                    const ray = tile.clone();
                    for (let i = 0; i < 24; i++) {
                        ray.x += direction.x;
                        ray.y += direction.y;

                        const rx = Math.round(ray.x);
                        const ry = Math.round(ray.y);
                        if (rx === light.x && ry === light.y) {
                            break; // Reached the light
                        }

                        const rindex = ry * tilemap.width + rx;
                        if (wallLayer[rindex] > 0) {
                            return; // Hit the wall
                        }
                    }

                    const radius = 16;
                    const dist = clamp(tile.distanceTo(light), 0, radius);
                    const value = (radius - dist) / radius;
                    color.r += value;
                    color.g += value;
                    color.b += value;
                });
            }
        }

        // Store new light map
        this.lightMap.length = 0;
        this.lightMap.push(...lightMap);

        // Render
        const renderDebug = true;
        if (!renderDebug) return;

        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        canvas.style.position = "absolute";
        document.body.appendChild(canvas);

        const ctx = canvas.getContext("2d");
        if (ctx !== null) {
            const fillTile = (x: number, y: number, color: string) => {
                const tilesize = 32;
                const pad = 2;
                ctx.fillStyle = color;
                ctx.fillRect(
                    x * tilesize,
                    y * tilesize,
                    tilesize - pad,
                    tilesize - pad
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
