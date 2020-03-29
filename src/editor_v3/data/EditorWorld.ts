import { Scene, PerspectiveCamera } from "three";

export class EditorWorld {
    public readonly scene = new Scene();
    public readonly camera = new PerspectiveCamera(90);
}
