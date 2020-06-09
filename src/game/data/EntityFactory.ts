import { uniqueId } from "lodash";
import {
    LocalAvatarArchetype,
    EnemyAvatarArchetype,
    ProjectileArchetype,
    AmmoPackArchetype,
    HealthArchetype,
} from "../ecs/Archetypes";

export module EntityFactory {
    const nextID = () => uniqueId("e");

    export function LocalAvatar(id = nextID()) {
        return { id, ...new LocalAvatarArchetype() };
    }

    export function EnemyAvatar(id = nextID()) {
        const enemy = { id, ...new EnemyAvatarArchetype() };

        return enemy;
    }

    export function Projectile(id = nextID()) {
        const projectile = { id, ...new ProjectileArchetype() };
        projectile.collision.height = 0.25;
        projectile.collision.radius = 0.125;
        return projectile;
    }

    export function AmmoPack(id = nextID()) {
        return { id, ...new AmmoPackArchetype() };
    }

    export function HealthPack(id = nextID()) {
        return { id, ...new HealthArchetype() };
        // const pickup = { id: nextID(), ...new PickupArchetype() };
        // pickup.pickup.pickupType = Components.PickupType.Health;

        // const mesh = "/assets/mesh/healt_pickup.gltf";
        // pickup.entityMesh = new Components.EntityMesh(mesh);

        // return pickup;
    }
}
