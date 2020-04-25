import { uniqueId } from "lodash";
import { EntityMesh } from "../Helpers";
import {
    PlayerArchetype,
    PickupArchetype,
    EnemyArchetype,
} from "../ecs/Archetypes";

export module EntityFactory {
    const nextID = () => uniqueId("e");

    export function Player() {
        return { id: nextID(), ...new PlayerArchetype() };
    }

    export function Enemy() {
        const enemy = { id: nextID(), ...new EnemyArchetype() };
        EntityMesh.set(enemy, "__ROBOT__");
        return enemy;
    }

    export function Pikcup() {
        const pickup = { id: nextID(), ...new PickupArchetype() };
        EntityMesh.set(pickup, "__HP_PACK__");
        return pickup;
    }
}
