import { Scene, PerspectiveCamera } from "three";

export class Hud {
    public readonly scene = new Scene();
    public readonly camera = new PerspectiveCamera(90);
}
