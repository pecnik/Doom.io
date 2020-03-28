import { Scene, Group, Mesh, PlaneGeometry, MeshBasicMaterial } from "three";
import { Tool } from "../tools/Tool";
import { loadTexture, TILE_ROWS, TILE_COLS } from "../EditorUtils";

export class ToolSelect {
    public readonly scene = new Scene();
    public readonly slots = new Group();

    public init(tools: Tool[]) {
        const size = 64;
        const padd = 0;

        const offsetx = (size + padd) * TILE_COLS * 0.5;
        const offsety = (size + padd) * TILE_ROWS * 0.5;

        tools.forEach((tool, index) => {
            loadTexture(tool.icon).then(map => {
                const geo = new PlaneGeometry(size, size);
                const mat = new MeshBasicMaterial({ map });
                const tile = new Mesh(geo, mat);
                tile.position.x += -offsetx;
                tile.position.y -= -offsety;

                tile.position.x -= size * 1.5;
                tile.position.y -= size * 1.5 * index;

                const mat2 = new MeshBasicMaterial({ color: 0x00ff55 });
                const outline = new Mesh(geo, mat2);
                outline.position.z = -1;
                outline.scale.setScalar(1.05);
                tile.add(outline);

                this.slots.add(tile);
            });
        });

        this.scene.add(this.slots);
    }
}
