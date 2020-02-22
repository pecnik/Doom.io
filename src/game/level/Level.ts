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
import { degToRad } from "../core/Utils";

export class Level {
    public readonly scene = new Scene();
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
            this.buildMesh(...data);
        });
    }

    public buildMesh(
        tilemap: Tiled2D.Tilemap,
        tileset: Tiled2D.Tileset,
        texture: Texture
    ) {
        this.scene.remove(...this.scene.children);

        this.rows = tilemap.height;
        this.cols = tilemap.width;

        const findLayer = (name: string): Tiled2D.TileLayer | undefined => {
            for (let i = 0; i < tilemap.layers.length; i++) {
                const layer = tilemap.layers[i];
                if (layer.name === name && layer.type === "tilelayer") {
                    return layer;
                }
            }
            return;
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
                    if (lights.data[index] > 0) {
                        lightPonts.push(new Vector2(x, z));
                    }
                }
            }
        }

        const getLightColor = (x: number, y: number) => {
            const radius = 6;
            const point = new Vector2(x, y);
            const color = new Color(0x111122);

            for (let i = 0; i < lightPonts.length; i++) {
                const light = lightPonts[i];
                let dist = radius - light.distanceTo(point);
                dist = Math.max(0, dist);
                color.r += dist / radius;
                color.g += dist / radius;
                color.b += dist / radius;
            }

            return color;
        };

        for (let z = 0; z < this.rows; z++) {
            for (let x = 0; x < this.cols; x++) {
                const index = z * tilemap.width + x;

                let color = getLightColor(x, z);
                // if (lights !== undefined) {
                //     const light = lights.data[index];
                //     if (light > 0) {
                //         color = new Color(0xff0000);
                //     }
                // }

                if (ceil !== undefined) {
                    const tileId = ceil.data[index];
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
                    const tileId = floor.data[index];
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
                    const tileId = wall.data[index];
                    if (tileId > 0) {
                        // Front wall
                        const frontWallIndex = (z + 1) * tilemap.width + x;
                        if (!wall.data[frontWallIndex]) {
                            const frontWall = new PlaneGeometry(1, 1, 1, 1);
                            setVertexColor(frontWall, color);
                            setTextureUV(frontWall.faceVertexUvs[0], tileId);
                            frontWall.rotateY(degToRad(0));
                            frontWall.translate(x, 0, z + 0.5);
                            planes.push(frontWall);
                        }

                        // Back wall
                        const backWallIndex = (z - 1) * tilemap.width + x;
                        if (!wall.data[backWallIndex]) {
                            const backWall = new PlaneGeometry(1, 1, 1, 1);
                            setVertexColor(backWall, color);
                            setTextureUV(backWall.faceVertexUvs[0], tileId);
                            backWall.rotateY(degToRad(180));
                            backWall.translate(x, 0, z - 0.5);
                            planes.push(backWall);
                        }

                        // Right wall
                        const rightWallIndex = z * tilemap.width + (x - 1);
                        if (!wall.data[rightWallIndex]) {
                            const rightWall = new PlaneGeometry(1, 1, 1, 1);
                            setVertexColor(rightWall, color);
                            setTextureUV(rightWall.faceVertexUvs[0], tileId);
                            rightWall.rotateY(degToRad(-90));
                            rightWall.translate(x - 0.5, 0, z);
                            planes.push(rightWall);
                        }

                        // Left wall
                        const leftWallIndex = z * tilemap.width + (x + 1);
                        if (!wall.data[leftWallIndex]) {
                            const leftWall = new PlaneGeometry(1, 1, 1, 1);
                            setVertexColor(leftWall, color);
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
}
