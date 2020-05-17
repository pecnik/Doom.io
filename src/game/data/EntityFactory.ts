import { uniqueId } from "lodash";
import {
    LocalAvatarArchetype,
    PickupArchetype,
    EnemyAvatarArchetype,
} from "../ecs/Archetypes";
import { WeaponType, WEAPON_SPEC_RECORD } from "./Weapon";
import { Components } from "../ecs";

export module EntityFactory {
    const nextID = () => uniqueId("e");

    export function LocalAvatar(id = nextID()) {
        return { id, ...new LocalAvatarArchetype() };
    }

    export function EnemyAvatar(id = nextID()) {
        const enemy = { id, ...new EnemyAvatarArchetype() };

        return enemy;
    }

    export function AmmoPikcup(weaponType: WeaponType) {
        const pickup = { id: nextID(), ...new PickupArchetype() };
        pickup.pickup.weaponType = weaponType;

        const mesh = WEAPON_SPEC_RECORD[weaponType].ammoPickupMesh;
        pickup.entityMesh = new Components.EntityMesh(mesh);

        return pickup;
    }
}
