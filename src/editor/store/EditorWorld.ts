import { Scene, PerspectiveCamera, Mesh } from "three";
import { Level } from "../level/Level";

export class EditorWorld {
    public readonly scene = new Scene();
    public readonly level = new Level.Level();
    public readonly camera = new PerspectiveCamera(90);
    public elapsedTime = 0;
    public floor = new Mesh();
}
