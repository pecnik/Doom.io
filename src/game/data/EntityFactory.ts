import { uniqueId } from "lodash";
import {
    LocalAvatarArchetype,
    EnemyAvatarArchetype,
    ProjectileArchetype,
    AmmoPackArchetype,
    HealthArchetype,
    PlayerArchetype,
} from "../ecs/Archetypes";

export module EntityFactory {
    const nextID = () => uniqueId("e");

    export function Player(id = nextID()) {
        return { id, ...new PlayerArchetype() };
    }

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
    }
}
