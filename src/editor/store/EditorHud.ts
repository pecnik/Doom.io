import { Scene, OrthographicCamera } from "three";
import { VIEW_WIDTH, VIEW_HEIGHT } from "../Constants";

export class EditorHud {
    public readonly scene = new Scene();
    public readonly camera = new OrthographicCamera(
        -VIEW_WIDTH / 2,
        VIEW_WIDTH / 2,
        VIEW_HEIGHT / 2,
        -VIEW_HEIGHT / 2,
        0,
        8
    );
}
