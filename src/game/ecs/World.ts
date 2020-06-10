import { Entity } from "./Entity";
import { System } from "./System";
import { Scene, PerspectiveCamera, Clock } from "three";
import { BulletDecals } from "../data/BulletDecals";
import { Particles } from "../data/Particles";
import { Family } from "./Family";
import { AnyComponents } from "./Components";
import { Level } from "../../editor/Level";
import { sortBy } from "lodash";

module Benchmark {
    const time = new Clock();
    const systems = new Map<
        string,
        {
            name: string;
            time: 0;
            count: 0;
        }
    >();

    const getData = (system: System) => {
        const name = system.constructor.name;
        let data = systems.get(name);
        if (data === undefined) {
            data = { name, time: 0, count: 0 };
            systems.set(name, data);
        }

        return data;
    };

    export function begin(system: System) {
        getData(system);
        time.elapsedTime = 0;
        time.start();
    }

    export function end(system: System) {
        const data = getData(system);
        data.time += time.getDelta() * 1000;
        data.count++;
    }

    export function Dump() {
        const table: {
            name: string;
            avg: string;
            time: string;
            count: string;
        }[] = [];
        systems.forEach((data) => {
            table.push({
                name: data.name,
                count: data.count.toString(),
                time: data.time.toFixed(8),
                avg: (data.time / data.count).toFixed(8),
            });
        });

        sortBy(table, (a) => -a.avg);

        console.table(table);
    }
}

export class World {
    public readonly BENCHMARK = Benchmark;

    private readonly systems = new Array<System>();
    public readonly entities = new Map<string, Entity>();
    public readonly scene = new Scene();
    public readonly camera = new PerspectiveCamera(90);
    public readonly level = new Level();
    public readonly decals = new BulletDecals();
    public readonly particles = new Particles();
    public readonly killfeed = new Array<{ killer: string; victim: string }>();
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
            const delta = this.elapsedTime - system.lastUpdate;
            if (delta >= system.updateInterval) {
                Benchmark.begin(system);
                system.lastUpdate = this.elapsedTime;
                system.update(dt);
                Benchmark.end(system);
            }
        });
    }
}
