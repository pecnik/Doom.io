import { Entity, Family } from "./ecs";
import { Components } from "./ecs";
import {
    Raycaster,
    PerspectiveCamera,
    Vector2,
    Intersection,
    Texture,
    TextureLoader,
    NearestFilter,
    Material,
    Vector3,
    Object3D,
} from "three";
import { World } from "./ecs";
import { WeaponState } from "./data/Types";
import { PLAYER_HEIGHT } from "./data/Globals";
import { WEAPON_SPEC_RECORD } from "./data/Weapon";
import { AvatarArchetype } from "./ecs/Archetypes";

export function getEntityMesh(
    world: World,
    entity: Entity
): Object3D | undefined {
    if (entity.entityMesh === undefined) return;
    return world.scene.getObjectById(entity.entityMesh.objectId);
}

export function getPlayerAvatar(
    playerId: string,
    avatars: Family<AvatarArchetype>
) {
    for (const [, avatar] of avatars.entities) {
        if (avatar.playerId === playerId) {
            return avatar;
        }
    }
    return;
}

export function getHeadPosition(
    entity: Entity<{
        position: Components.Position;
        collision: Components.Collision;
    }>
): Vector3 {
    const head = entity.position.clone();
    head.y += entity.collision.height - 0.125;
    return head;
}

export function getWeaponAmmo(
    entity: { shooter: Components.Shooter },
    weaponType = entity.shooter.weaponType
) {
    return entity.shooter.ammo[weaponType];
}

export function getWeaponSpec(
    entity: { shooter: Components.Shooter },
    weaponType = entity.shooter.weaponType
) {
    return WEAPON_SPEC_RECORD[weaponType];
}

export function isCrouched(
    entity: Entity<{ collision: Components.Collision }>
): boolean {
    return entity.collision.height < PLAYER_HEIGHT;
}

export function isScopeActive(
    entity: Entity<{
        shooter: Components.Shooter;
        input: Components.Input;
    }>
): boolean {
    const { shooter } = entity;
    if (shooter.state == WeaponState.Reload) return false;
    if (shooter.state == WeaponState.Swap) return false;

    const { input } = entity;
    const weapon = WEAPON_SPEC_RECORD[shooter.weaponType];
    return input.scope && weapon.scope;
}

export function getNormalAxis(normal: Vector3): "x" | "y" | "z" {
    if (Math.abs(Math.round(normal.x)) === 1) return "x";
    if (Math.abs(Math.round(normal.y)) === 1) return "y";
    return "z";
}

export module Hitscan {
    export const caster: { entity?: Entity } = {};
    export const raycaster = new Raycaster();
    export const camera = new PerspectiveCamera(45);
    export const origin = new Vector2();

    const buffer = new Array<Intersection>();
    const response: {
        intersection?: Intersection;
        entity?: Entity;
    } = {};

    export function cast(
        world: World,
        family?: Family<{ entityMesh: Components.EntityMesh }>
    ) {
        response.intersection = undefined;
        response.entity = undefined;
        buffer.length = 0;

        const level = world.level.mesh;
        raycaster.intersectObject(level, true, buffer);
        response.intersection = buffer[0];

        if (family !== undefined) {
            family.entities.forEach((entity) => {
                const obj = getEntityMesh(world, entity);
                if (obj === undefined) return;

                raycaster.intersectObject(obj, true, buffer);

                const [next] = buffer;
                if (next !== undefined && next !== response.intersection) {
                    response.intersection = next;
                    response.entity = entity;
                }
            });
        }

        return response;
    }
}

export function loadTexture(src: string): Promise<Texture> {
    return new Promise((resolve) => {
        // Pixelated when near, smooth when far
        new TextureLoader().load(src, (map) => {
            // map.minFilter = NearestFilter;
            map.magFilter = NearestFilter;
            resolve(map);
        });
    });
}

export function disposeMeshMaterial(material: Material | Material[]) {
    if (material instanceof Material) {
        material.dispose();
    } else {
        material.forEach((material) => material.dispose());
    }
}
