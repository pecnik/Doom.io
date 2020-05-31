import { AllComponents, AnyComponents } from "./Components";
import { Entity } from "./Entity";
import { sortBy, isEqual } from "lodash";

export class Family<T extends AnyComponents> {
    private static readonly list = new Array<Family<any>>();

    public static findOrCreate<T>(archetype: T) {
        const comps = sortBy(Object.keys(archetype)) as (keyof AllComponents)[];

        for (let i = 0; i < Family.list.length; i++) {
            const family = Family.list[i];
            if (isEqual(family.comps, comps)) {
                return family as Family<T>;
            }
        }

        const family = new Family<T>(comps);
        Family.list.push(family);

        return family as Family<T>;
    }

    public static updateEntity(entity: Entity) {
        Family.list.forEach((family) => {
            const myEntity = family.entities.get(entity.id);

            if (family.check(entity) && myEntity === undefined) {
                family.entities.set(entity.id, entity);
                family.onEntityAdded.forEach((fn) => fn(entity));
            }

            if (!family.check(entity) && myEntity !== undefined) {
                family.onEntityRemvoed.forEach((fn) => fn(myEntity));
                family.entities.delete(entity.id);
            }
        });
    }

    public static removeEntity(id: string) {
        Family.list.forEach((family) => {
            const myEntity = family.entities.get(id);
            if (myEntity !== undefined) {
                family.onEntityRemvoed.forEach((fn) => fn(myEntity));
                family.entities.delete(myEntity.id);
            }
        });
    }

    private readonly comps: Array<keyof AllComponents>;
    public readonly entities = new Map<string, Entity<T>>();
    public readonly onEntityAdded = new Array<(e: Entity<T>) => void>();
    public readonly onEntityRemvoed = new Array<(e: Entity<T>) => void>();

    private constructor(comps: Array<keyof AllComponents>) {
        this.comps = comps;
    }

    public check(entity: Entity) {
        for (let i = 0; i < this.comps.length; i++) {
            const key = this.comps[i];
            if (entity[key] === undefined) return false;
        }
        return true;
    }

    public first(): Entity<T> | undefined {
        return this.entities.values().next().value;
    }
}
