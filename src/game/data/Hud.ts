import { Scene, OrthographicCamera } from "three";
import { HUD_WIDTH, HUD_HEIGHT } from "./Globals";

export class Hud {
    public readonly layers = Array<Scene>();
    public readonly camera = new OrthographicCamera(
        -HUD_WIDTH / 2,
        HUD_WIDTH / 2,
        HUD_HEIGHT / 2,
        -HUD_HEIGHT / 2,
        0,
        512
    );
}
