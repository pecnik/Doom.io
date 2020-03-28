import {
    OrthographicCamera,
    Scene,
    TextureLoader,
    MeshBasicMaterial,
    AdditiveBlending,
    NearestFilter,
    PlaneGeometry,
    Mesh
} from "three";
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

    public constructor() {
        new TextureLoader().load("/assets/sprites/crosshair.png", map => {
            const material = new MeshBasicMaterial({
                map,
                blending: AdditiveBlending,
                depthTest: false,
                depthWrite: false
            });

            map.magFilter = NearestFilter;
            map.minFilter = NearestFilter;

            const geometry = new PlaneGeometry(48, 48);
            const crosshair = new Mesh(geometry, material);
            this.scene.add(crosshair);
        });
    }
}
