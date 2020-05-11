import { uniqueId } from "lodash";
import { EntityMesh } from "../Helpers";
import {
    LocalAvatarArchetype,
    PickupArchetype,
    EnemyAvatarArchetype,
} from "../ecs/Archetypes";
import { WeaponType, WEAPON_SPEC_RECORD } from "./Weapon";

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

    export function AmmoPikcup(weaponType: WeaponType) {
        const pickup = { id: nextID(), ...new PickupArchetype() };
        pickup.pickup.weaponType = weaponType;

        const weaponSpec = WEAPON_SPEC_RECORD[weaponType];
        EntityMesh.set(pickup, weaponSpec.ammoPickupMesh);

        return pickup;
    }
}
