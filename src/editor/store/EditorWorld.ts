import { Scene, PerspectiveCamera, Mesh, Texture } from "three";

export class EditorWorld {
    public readonly scene = new Scene();
    public readonly camera = new PerspectiveCamera(90);
    public elapsedTime = 0;
    public floor = new Mesh();
    public level = new Mesh();
    public texture = new Texture();
}
