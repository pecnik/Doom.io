import {
    Scene,
    Group,
    Mesh,
    PlaneGeometry,
    MeshBasicMaterial,
    Texture
} from "three";
import { TILE_COLS, TILE_ROWS, setTextureUV } from "../EditorUtils";

export class TextureSelect {
    public readonly scene = new Scene();
    public readonly slots = new Group();

    public init(map: Texture) {
        const size = 64;
        const padd = 0;
        const offsetx = (size + padd) * TILE_COLS * 0.5;
        const offsety = (size + padd) * TILE_ROWS * 0.5;

        for (let y = 0; y < TILE_ROWS; y++) {
            for (let x = 0; x < TILE_COLS; x++) {
                const index = this.slots.children.length;
                const geo = new PlaneGeometry(size, size);
                const mat = new MeshBasicMaterial({ map });
                const tile = new Mesh(geo, mat);
                tile.position.x += (size + padd) * x - offsetx;
                tile.position.y -= (size + padd) * y - offsety;
                setTextureUV(geo, index);
                this.slots.add(tile);

                const mat2 = new MeshBasicMaterial({ color: 0x00ff55 });
                const outline = new Mesh(geo, mat2);
                outline.position.z = -1;
                outline.scale.setScalar(1.05);
                tile.add(outline);
            }
        }

        this.scene.add(this.slots);
    }
}
