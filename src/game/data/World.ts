import { Engine } from "@nova-engine/ecs";
import { Scene, PerspectiveCamera } from "three";
import { Level } from "./Level";
import { BulletDecals } from "../utils/BulletDecals";
import { Particles } from "../utils/Particles";

export class World extends Engine {
    public readonly level = new Level();
    public readonly scene = new Scene();
    public readonly camera = new PerspectiveCamera(90);
    public readonly decals = new BulletDecals();
    public readonly particles = new Particles();
    public elapsedTime = 0;

    public constructor() {
        super();
        this.scene.add(this.level.scene);
        this.scene.add(this.decals.scene);
        this.scene.add(this.particles.scene);
        this.scene.add(this.camera);
    }

    public update(dt: number) {
        super.update(dt);
        this.decals.update(dt);
        this.particles.update(dt);
    }
}
