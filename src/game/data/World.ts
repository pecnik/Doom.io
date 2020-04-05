import { Engine } from "../core/ecs";
import { Scene, PerspectiveCamera, AudioListener, Mesh } from "three";
import { BulletDecals } from "../utils/BulletDecals";
import { Particles } from "../utils/Particles";
import { Level } from "../../editor/level/Level";

export class World extends Engine {
    public readonly level = new Level.Level();
    public readonly scene = new Scene();
    public readonly camera = new PerspectiveCamera(90);
    public readonly decals = new BulletDecals();
    public readonly particles = new Particles();

    public elapsedTime = 0;
    public listener?: AudioListener;

    public constructor() {
        super();
        this.scene.add(this.particles.scene);
        this.scene.add(this.decals.scene);
        this.scene.add(this.camera);
    }

    public update(dt: number) {
        super.update(dt);
        this.decals.update(dt);
        this.particles.update(this, dt);
    }
}
