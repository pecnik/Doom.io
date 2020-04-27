import { uniqueId, random } from "lodash";
import { EntityMesh } from "../Helpers";
import {
    PlayerArchetype,
    PickupArchetype,
    EnemyArchetype,
} from "../ecs/Archetypes";
import { WeaponSpecs } from "../weapons/Weapon";

export module EntityFactory {
    const nextID = () => uniqueId("e");

    export function Player(id = nextID()) {
        return { id, ...new PlayerArchetype() };
    }

    export function Enemy(id = nextID()) {
        const enemy = { id, ...new EnemyArchetype() };
        EntityMesh.set(enemy, "__ROBOT__");
        return enemy;
    }

    export function Pikcup(weaponIndex = random(0, WeaponSpecs.length - 1)) {
        const { ammoPackName } = WeaponSpecs[weaponIndex];
        const pickup = { id: nextID(), ...new PickupArchetype() };
        pickup.pickup.weaponIndex = weaponIndex;
        EntityMesh.set(pickup, ammoPackName);
        return pickup;
    }
}
