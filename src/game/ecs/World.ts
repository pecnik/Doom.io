import { Entity } from "./Entity";
import { System } from "./System";
import { Scene, PerspectiveCamera } from "three";
import { Level } from "../data/Level";
import { BulletDecals } from "../data/BulletDecals";
import { Particles } from "../data/Particles";
import { Family } from "./Family";
import { AnyComponents } from "./Components";

export class World {
    private readonly systems = new Array<System>();
    public readonly entities = new Map<string, Entity>();
    public readonly scene = new Scene();
    public readonly camera = new PerspectiveCamera(90);
    public readonly level = new Level();
    public readonly decals = new BulletDecals();
    public readonly particles = new Particles();
    public elapsedTime = 0;

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
        if (this.entities.has(entity.id)) {
            throw new Error(`Duplicate Entity ID: "${entity.id}"`);
        }
        this.entities.set(entity.id, entity);
        Family.updateEntity(entity);
    }

    public removeEntity(id: string) {
        const entity = this.entities.get(id);
        if (entity !== undefined) {
            this.entities.delete(entity.id);
            Family.removeEntity(entity.id);
        }
    }

    public addComponents(id: string, comps: AnyComponents) {
        const entity = this.entities.get(id);
        if (entity !== undefined) {
            Object.assign(entity, comps);
            Family.updateEntity(entity);
        }
    }

    public removeComponents(id: string, ...comps: Array<keyof AnyComponents>) {
        const entity = this.entities.get(id);
        if (entity !== undefined) {
            comps.forEach((comp) => delete entity[comp]);
            Family.updateEntity(entity);
        }
    }

    public update(dt: number) {
        this.elapsedTime += dt;
        this.decals.update(dt);
        this.particles.update(this, dt);
        this.systems.forEach((system: System) => {
            system.update(dt);
        });
    }
}
