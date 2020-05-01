import { uniqueId, random } from "lodash";
import { EntityMesh } from "../Helpers";
import {
    LocalAvatarArchetype,
    PickupArchetype,
    EnemyAvatarArchetype,
} from "../ecs/Archetypes";
import { WeaponSpecs } from "./Types";

export module EntityFactory {
    const nextID = () => uniqueId("e");

    export function LocalAvatar(id = nextID()) {
        return { id, ...new LocalAvatarArchetype() };
    }

    export function EnemyAvatar(id = nextID()) {
        const enemy = { id, ...new EnemyAvatarArchetype() };
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
