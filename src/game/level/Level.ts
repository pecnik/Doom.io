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
    NearestFilter
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
            this.build(...data);
        });
    }

    public build(
        tilemap: Tiled2D.Tilemap,
        tileset: Tiled2D.Tileset,
        texture: Texture
    ) {
        console.log({ tilemap, tileset });
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

        const planes: PlaneGeometry[] = [];

        const floor = findLayer("Floor");
        for (let z = 0; z < this.rows; z++) {
            for (let x = 0; x < this.cols; x++) {
                const index = z * tilemap.width + x;
                if (floor !== undefined) {
                    const tileId = floor.data[index];
                    if (tileId > 0) {
                        const plane = new PlaneGeometry(1, 1, 1, 1);
                        setTextureUV(plane.faceVertexUvs[0], tileId);
                        plane.rotateX(degToRad(-90));
                        plane.translate(x, -0.5, z);
                        planes.push(plane);
                    }
                }
            }
        }

        const geometry = new Geometry();
        planes.forEach(plane => {
            geometry.merge(plane);
            plane.dispose();
        });

        const materal = new MeshBasicMaterial({ map: texture });
        texture.minFilter = NearestFilter;
        texture.magFilter = NearestFilter;

        const mesh = new Mesh(geometry, materal);
        this.scene.add(mesh);
    }
}
