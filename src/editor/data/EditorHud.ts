import { OrthographicCamera, Scene, Object3D } from "three";
import { HUD_WIDTH, HUD_HEIGHT } from "../../game/data/Globals";

export class EditorHud {
    public readonly scene = new Scene();
    public readonly camera = new OrthographicCamera(
        -HUD_WIDTH / 2,
        HUD_WIDTH / 2,
        HUD_HEIGHT / 2,
        -HUD_HEIGHT / 2,
        0,
        30
    );

    public readonly cursor = new Object3D();

    public constructor() {
        this.scene.add(this.cursor, this.camera);
        this.cursor.renderOrder = 1;
    }
}
