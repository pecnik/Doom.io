import { Scene, OrthographicCamera } from "three";

export class Hud {
    public readonly scene = new Scene();
    public readonly camera = new OrthographicCamera(0, 0, 0, 0, 0, 30);
}
