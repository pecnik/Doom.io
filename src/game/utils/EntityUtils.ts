import GLTFLoader from "three-gltf-loader";
import { Entity, Family, EngineEntityListener } from "@nova-engine/ecs";
import { Comp } from "../data/Comp";
import {
    Mesh,
    MeshBasicMaterial,
    NearestFilter,
    Raycaster,
    PerspectiveCamera,
    Vector2,
    Intersection
} from "three";
import { World } from "../data/World";

export function onFamilyChange(
    world: World,
    family: Family,
    handler: Partial<EngineEntityListener>
) {
    const { onEntityAdded = () => {}, onEntityRemoved = () => {} } = handler;
    const listener = {
        onEntityAdded(entity: Entity) {
            if (family.includesEntity(entity)) {
                onEntityAdded(entity);
            }
        },
        onEntityRemoved(entity: Entity) {
            if (family.includesEntity(entity)) {
                onEntityRemoved(entity);
            }
        }
    };

    world.addEntityListener(listener);
}

export function isScopeActive(world: World, entity: Entity) {
    if (!entity.getComponent(Comp.Shooter)) {
        return false;
    }

    const input = entity.getComponent(Comp.PlayerInput);
    const shooter = entity.getComponent(Comp.Shooter);
    const weapon = world.weapons[shooter.weaponIndex];
    return input.scope && weapon.scope;
}

export function loadRenderMesh(entity: Entity, src: string) {
    return new Promise(resolve => {
        new GLTFLoader().load(src, glb => {
            const render = entity.getComponent(Comp.Render);
            render.obj.add(glb.scene);
            render.obj.traverse(child => {
                if (child instanceof Mesh) {
                    if (child.material instanceof MeshBasicMaterial) {
                        render.mat = child.material;
                        render.geo = child.geometry;
                    }
                }
            });

            if (render.mat.map) {
                render.mat.map.magFilter = NearestFilter;
                render.mat.map.minFilter = NearestFilter;
            }

            resolve();
        });
    });
}

export function setColliderFromMesh(entity: Entity) {
    const render = entity.getComponent(Comp.Render);
    const collider = entity.getComponent(Comp.Collider);

    render.geo.computeBoundingBox();

    collider.min.x = render.geo.boundingBox.min.x;
    collider.min.y = render.geo.boundingBox.min.z;

    collider.max.x = render.geo.boundingBox.max.x;
    collider.max.y = render.geo.boundingBox.max.z;
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

    export function cast(world: World, family?: Family) {
        response.intersection = undefined;
        response.entity = undefined;
        buffer.length = 0;

        const level = world.level.scene;
        raycaster.intersectObject(level, true, buffer);
        response.intersection = buffer[0];

        if (family !== undefined) {
            family.entities.forEach(entity => {
                const render = entity.getComponent(Comp.Render);
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
