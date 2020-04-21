import { World } from "./World";
import { AllComponents, AnyComponents } from "./Components";
import { Entity } from "./Entity";

export class Family<T extends AnyComponents> {
    public readonly entities = new Map<string, Entity<T>>();
    public readonly onEntityAdded = new Array<(e: Entity<T>) => void>();
    public readonly onEntityRemvoed = new Array<(e: Entity<T>) => void>();

    public constructor(engine: World, archetype: T) {
        const comps = Object.keys(archetype) as Array<keyof AllComponents>;
        const check = (entity: Entity): boolean => {
            for (let i = 0; i < comps.length; i++) {
                const key = comps[i];
                if (entity[key] === undefined) return false;
            }
            return true;
        };

        engine.onEntityAdded.push((entity: Entity) => {
            if (check(entity)) {
                this.entities.set(entity.id, entity as Entity<T>);
                this.onEntityAdded.forEach((fn) => fn(entity as Entity<T>));
            }
        });

        engine.onEntityRemvoed.push((entity: Entity) => {
            if (this.entities.has(entity.id)) {
                this.onEntityRemvoed.forEach((fn) => fn(entity as Entity<T>));
                this.entities.delete(entity.id);
            }
        });
    }
}
