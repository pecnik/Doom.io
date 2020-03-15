import GLTFLoader from "three-gltf-loader";
import { Entity, Family, EngineEntityListener } from "@nova-engine/ecs";
import { Comp } from "./Comp";
import { Mesh, MeshBasicMaterial, NearestFilter } from "three";
import { World } from "./World";

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

export function setRenderMesh(entity: Entity, src: string) {
    new GLTFLoader().load(src, glb => {
        const render = entity.getComponent(Comp.Render);
        render.obj.remove(...render.obj.children);
        glb.scene.traverse(child => {
            if (render.obj.children.length > 0) {
                return;
            }

            if (child instanceof Mesh) {
                if (child.material instanceof MeshBasicMaterial) {
                    render.obj.add(child);
                    render.mat = child.material;
                    render.geo = child.geometry;
                }
            }
        });

        if (render.mat.map) {
            render.mat.map.magFilter = NearestFilter;
            render.mat.map.minFilter = NearestFilter;
        }
    });
}
