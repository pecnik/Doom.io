import { Entity, Family } from "./ecs";
import { Components } from "./ecs";
import {
    Raycaster,
    PerspectiveCamera,
    Vector2,
    Texture,
    TextureLoader,
    NearestFilter,
    Material,
    Vector3,
    Object3D,
    Matrix4,
} from "three";
import { World } from "./ecs";
import { WeaponState } from "./data/Types";
import { PLAYER_HEIGHT } from "./data/Globals";
import { WEAPON_SPEC_RECORD } from "./data/Weapon";
import { AvatarArchetype, LocalAvatarArchetype } from "./ecs/Archetypes";
import { memoize } from "lodash";

export function getEntityMesh(
    world: World,
    entity: Entity
): Object3D | undefined {
    if (entity.entityMesh === undefined) return;
    return world.scene.getObjectById(entity.entityMesh.objectId);
}

export function getMoveDirection(avatar: LocalAvatarArchetype) {
    const move = new Vector2(avatar.input.movex, avatar.input.movey);
    move.normalize();
    move.rotateAround(new Vector2(), -avatar.rotation.y);
    return move;
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

export function getAngleV2(
    p1: { x: number; y: number },
    p2: { x: number; y: number }
) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

export module Hitscan {
    export const caster: { entity?: Entity } = {};
    export const raycaster = new Raycaster();
    export const camera = new PerspectiveCamera(45);
    export const origin = new Vector2();
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

export const getHeadingVector3 = (() => {
    const object = new Object3D();
    const matrix = new Matrix4();
    const vector = new Vector3(0, 0, -1);
    return (rotation: Vector3) => {
        object.rotation.set(rotation.x, rotation.y, rotation.z, "YXZ");
        object.updateWorldMatrix(false, false);

        matrix.extractRotation(object.matrixWorld);

        vector.set(0, 0, -1);
        vector.applyMatrix4(matrix).normalize();

        return vector.clone();
    };
})();

export const getImage = memoize((src: string) => {
    const img = new Image();
    img.src = src;
    return img;
});
