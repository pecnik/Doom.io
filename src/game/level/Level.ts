import { Tiled2D } from "./Tiled2D";
import {
    Scene,
    PlaneGeometry,
    Mesh,
    Geometry,
    MeshBasicMaterial,
    Texture,
    TextureLoader,
    Vector2
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

        const setTextureUV = (
            cords: Vector2[][],
            tileId: number,
            filpX = false,
            flipY = false
        ) => {
            const { imagewidth, imageheight, tilewidth, tileheight } = tileset;
            const x = tileId % tilewidth;
            const y = Math.floor(tileId / tilewidth);

            const minX = x;
            const maxX = x + tilewidth;
            const minY = y;
            const maxY = y + tileheight;

            const x0 = filpX ? maxX : minX;
            const x1 = filpX ? minX : maxX;
            const y0 = flipY ? minY : maxY;
            const y1 = flipY ? maxY : minY;

            console.log({ x0, x1, y0, y1 });

            cords[0][0].set(x0 / imagewidth, 1.0 - y0 / imageheight);
            cords[0][1].set(x0 / imagewidth, 1.0 - y1 / imageheight);
            cords[0][2].set(x1 / imagewidth, 1.0 - y0 / imageheight);

            cords[1][0].set(x1 / imagewidth, 1.0 - y1 / imageheight);
            cords[1][1].set(x0 / imagewidth, 1.0 - y1 / imageheight);
            cords[1][2].set(x0 / imagewidth, 1.0 - y0 / imageheight);
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
                        plane.rotateX(degToRad(-90));
                        plane.translate(x, -0.5, z);
                        planes.push(plane);
                        setTextureUV(plane.faceVertexUvs[0], tileId);
                    }
                }
            }
        }

        const geometry = new Geometry();
        planes.forEach(plane => {
            geometry.merge(plane);
            plane.dispose();
        });

        const materal = new MeshBasicMaterial({
            map: texture
        });

        const mesh = new Mesh(geometry, materal);
        this.scene.add(mesh);
    }
}
