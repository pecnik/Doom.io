import { Entity } from "./Entity";
import { System } from "./System";
import { Scene, PerspectiveCamera, AudioListener } from "three";
import { Level } from "../data/Level";
import { BulletDecals } from "../data/BulletDecals";
import { Particles } from "../data/Particles";

export class World {
    private readonly systems = new Array<System>();

    public readonly onEntityAdded = new Array<(e: Entity) => void>();
    public readonly onEntityRemvoed = new Array<(e: Entity) => void>();

    public readonly entities = new Map<string, Entity>();
    public readonly scene = new Scene();
    public readonly camera = new PerspectiveCamera(90);
    public readonly level = new Level();
    public readonly decals = new BulletDecals();
    public readonly particles = new Particles();
    public elapsedTime = 0;
    public listener?: AudioListener;

    public constructor() {
        this.scene.add(this.level.mesh);
        this.scene.add(this.particles.scene);
        this.scene.add(this.decals.scene);
        this.scene.add(this.camera);
    }

    public addSystem(system: System) {
        this.systems.push(system);
    }

    public addEntity(entity: Entity) {
        this.entities.set(entity.id, entity);
        this.onEntityAdded.forEach((fn) => fn(entity));
    }

    public removeEntity(id: string) {
        const entity = this.entities.get(id);
        if (entity !== undefined) {
            this.onEntityRemvoed.forEach((fn) => fn(entity));
            this.entities.set(entity.id, entity);
        }
    }

    public update(dt: number) {
        this.systems.forEach((system: System) => {
            system.update(this, dt);
        });

        this.decals.update(dt);
        this.particles.update(this, dt);
    }
}
