import { uniqueId } from "lodash";
import { Comp } from "../ecs";
import { EntityMesh } from "../Helpers";
import { PlayerArchetype, PickupArchetype } from "../ecs/Archetypes";

export module EntityFactory {
    const nextID = () => uniqueId("e");

    export function Player() {
        return { id: nextID(), ...new PlayerArchetype() };
    }

    export function Pikcup() {
        const pickup = { id: nextID(), ...new PickupArchetype() };
        EntityMesh.set(pickup, "__BARREL__");
        return pickup;
    }

    export function Barrel() {
        const entity = {
            id: nextID(),
            position: new Comp.Position(),
            render: new Comp.Render(),
            health: new Comp.Health(),
            velocity: new Comp.Velocity(),
            rotation: new Comp.Rotation(),
            collision: new Comp.Collision(),
        };

        EntityMesh.set(entity, "__BARREL__");

        return entity;
    }
}
