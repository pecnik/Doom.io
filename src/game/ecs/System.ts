import { Group } from "three";
import { World } from "./World";
import { Family } from "./Family";
import { Entity } from "./Entity";
import { AnyComponents } from "./Components";

export abstract class System {
    protected readonly world: World;

    public constructor(world: World) {
        this.world = world;
    }

    public abstract update(_: number): void;

    protected createEntityFamily<T extends AnyComponents>(props: {
        archetype: T;
        onEntityAdded?: (e: Entity<T>) => void;
        onEntityRemvoed?: (e: Entity<T>) => void;
    }) {
        const family = new Family(this.world, props.archetype);
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
        this.world.scene.add(group);
        return group;
    }
}
