import { Group } from "three";
import { World } from "./World";
import { Family } from "./Family";
import { Entity } from "./Entity";
import { AnyComponents } from "./Components";

export abstract class System {
    protected readonly engine: World;
    public constructor(engine: World) {
        this.engine = engine;
    }
    public abstract update(world: World, _: number): void;
    protected createEntityFamily<T extends AnyComponents>(props: {
        archetype: T;
        onEntityAdded?: (e: Entity<T>) => void;
        onEntityRemvoed?: (e: Entity<T>) => void;
    }) {
        const family = new Family(this.engine, props.archetype);
        if (props.onEntityAdded !== undefined) {
            family.onEntityAdded.push(props.onEntityAdded);
        }
        if (props.onEntityRemvoed !== undefined) {
            family.onEntityRemvoed.push(props.onEntityRemvoed);
        }
        return family;
    }

    protected createSceneGroup() {
        const group = new Group();
        this.engine.scene.add(group);
        return group;
    }
}
