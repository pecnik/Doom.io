import { Engine } from "@nova-engine/ecs";
import { Scene, PerspectiveCamera } from "three";
import { Level } from "./level/Level";

export class World extends Engine {
    public readonly level = new Level();
    public readonly scene = new Scene();
    public readonly camera = new PerspectiveCamera(90);
    public elapsedTime = 0;

    public constructor() {
        super();
        this.scene.add(this.level.scene);
    }
}
