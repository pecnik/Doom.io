import { Group } from "three";
import { World } from "./World";
import { Family } from "./Family";
import { Entity } from "./Entity";
import { AnyComponents } from "./Components";
import { GameContext } from "../GameContext";

export abstract class System<T extends GameContext = GameContext> {
    protected readonly game: T;
    protected readonly world: World;
    public constructor(game: T) {
        this.game = game;
        this.world = game.world;
    }

    public lastUpdate: number = 0;
    public readonly updateInterval: number = 0;
    public abstract update(_: number): void;

    protected createEntityFamily<T extends AnyComponents>(props: {
        archetype: T;
        onEntityAdded?: (e: Entity<T>) => void;
        onEntityRemvoed?: (e: Entity<T>) => void;
    }) {
        const family = Family.findOrCreate(props.archetype);

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
