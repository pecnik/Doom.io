import {
    Scene,
    Group,
    Mesh,
    PlaneGeometry,
    MeshBasicMaterial,
    Texture
} from "three";
import { VIEW_HEIGHT } from "../Editor";

export class TextureBar {
    public readonly count = 8;
    public readonly scene = new Scene();
    public readonly slots = new Group();

    public init(map: Texture) {
        const size = 128;
        const padd = 16;
        const offsetx = (size + padd) * this.count * 0.5;
        const offsety = VIEW_HEIGHT / 2;

        for (let i = 0; i < this.count; i++) {
            const geo = new PlaneGeometry(size, size);
            const mat = new MeshBasicMaterial({ map });
            const tile = new Mesh(geo, mat);
            tile.position.x += (size + padd) * i - offsetx;
            tile.position.y += size / 2 + padd - offsety;
            this.slots.add(tile);

            const mat2 = new MeshBasicMaterial({ color: 0x00ff55 });
            const outline = new Mesh(geo, mat2);
            outline.position.z = -1;
            outline.scale.setScalar(1.05);
            tile.add(outline);
        }
        this.scene.add(this.slots);
    }
}
