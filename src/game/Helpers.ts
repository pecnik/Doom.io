import GLTFLoader from "three-gltf-loader";
import { Entity, Family } from "./ecs";
import { Comp } from "./ecs";
import {
    Mesh,
    MeshBasicMaterial,
    Raycaster,
    PerspectiveCamera,
    Vector2,
    Intersection,
    Texture,
    TextureLoader,
    NearestFilter,
    Material,
    Vector3,
    Scene,
} from "three";
import { World } from "./ecs";
import { WeaponSpecs, WeaponState } from "./data/Weapon";
import { PLAYER_HEIGHT } from "./data/Globals";

export function getHeadPosition(
    entity: Entity<{
        position: Comp.Position;
        collision: Comp.Collision;
    }>
): Vector3 {
    const head = entity.position.clone();
    head.y += entity.collision.height - 0.125;
    return head;
}

export function isCrouched(
    entity: Entity<{ collision: Comp.Collision }>
): boolean {
    return entity.collision.height < PLAYER_HEIGHT;
}

export function isScopeActive(
    entity: Entity<{
        shooter: Comp.Shooter;
        input: Comp.PlayerInput;
    }>
): boolean {
    const { shooter } = entity;
    if (shooter.state == WeaponState.Reload) return false;
    if (shooter.state == WeaponState.Swap) return false;

    const { input } = entity;
    const weapon = WeaponSpecs[shooter.weaponIndex];
    return input.scope && weapon.scope;
}

export module EntityMesh {
    let glbScene = new Scene();

    export type RenderArchetype = Entity<{ render: Comp.Render }>;

    export function load() {
        return Promise.all([
            // Load geometry data
            new Promise((resolve) => {
                new GLTFLoader().load("/assets/mesh/mesh_list.glb", (glb) => {
                    glbScene = glb.scene;
                    resolve();
                });
            }),
        ]);
    }

    export function set(entity: RenderArchetype, name: string) {
        const obj = glbScene.getObjectByName(name);
        if (obj instanceof Mesh) {
            entity.render.geo = obj.geometry;
            entity.render.mat = (obj.material as MeshBasicMaterial).clone();

            const mesh = new Mesh(entity.render.geo, entity.render.mat);
            entity.render.obj.add(mesh);

            if (entity.render.mat.map) {
                entity.render.mat.map.minFilter = NearestFilter;
                entity.render.mat.map.magFilter = NearestFilter;
            }
        }
    }
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
        family?: Family<{ render: Comp.Render }>
    ) {
        response.intersection = undefined;
        response.entity = undefined;
        buffer.length = 0;

        const level = world.level.mesh;
        raycaster.intersectObject(level, true, buffer);
        response.intersection = buffer[0];

        if (family !== undefined) {
            family.entities.forEach((entity) => {
                const { render } = entity;
                raycaster.intersectObject(render.obj, true, buffer);

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
        new TextureLoader().load(src, (map) => {
            map.minFilter = NearestFilter;
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
