import { Scene, Group, Mesh, PlaneGeometry, MeshBasicMaterial } from "three";
import { VIEW_HEIGHT } from "../Editor";

export class TextureBar {
    public readonly count = 8;
    public readonly scene = new Scene();
    public readonly tiles = new Group();

    public constructor() {
        const size = 128;
        const padd = 16;
        const offsetx = (size + padd) * this.count * 0.5;
        const offsety = VIEW_HEIGHT / 2;

        for (let i = 0; i < this.count; i++) {
            const geo = new PlaneGeometry(size, size);
            const mat = new MeshBasicMaterial({
                wireframe: true,
                color: 0x00ff88
            });
            const tile = new Mesh(geo, mat);
            tile.position.x += (size + padd) * i - offsetx;
            tile.position.y += size / 2 + padd - offsety;
            this.tiles.add(tile);
        }
        this.scene.add(this.tiles);
    }
}
