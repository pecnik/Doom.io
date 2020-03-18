import { Engine } from "@nova-engine/ecs";
import { Scene, PerspectiveCamera, AudioListener } from "three";
import { Level } from "./Level";
import { BulletDecals } from "../utils/BulletDecals";
import { Particles } from "../utils/Particles";
import { Weapon } from "./Weapon";

export class World extends Engine {
    public elapsedTime = 0;

    public readonly scene = new Scene();
    public readonly level = new Level();
    public readonly camera = new PerspectiveCamera(90);
    public readonly decals = new BulletDecals();
    public readonly particles = new Particles();
    public listener?: AudioListener;

    public readonly weapons: Weapon[] = [
        {
            povSpriteSrc: "/assets/sprites/pov-gun.png",
            fireSoundSrc: "/assets/sounds/fire-gun.wav",
            firerate: 1 / 3
        },
        {
            povSpriteSrc: "/assets/sprites/pov-shotgun.png",
            fireSoundSrc: "/assets/sounds/fire-shotgun.wav",
            firerate: 1
        },
        {
            povSpriteSrc: "/assets/sprites/pov-machine-gun.png",
            fireSoundSrc: "/assets/sounds/fire-machine-gun.wav",
            firerate: 1 / 8
        }
    ];

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
