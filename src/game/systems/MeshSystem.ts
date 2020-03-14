import GltfLoader from "three-gltf-loader";
import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { World } from "../data/World";
import {
    RotationComponent,
    PositionComponent,
    MeshComponent,
    Object3DComponent
} from "../data/Components";
import { Mesh, MeshBasicMaterial } from "three";

export class MeshSystem extends System {
    private readonly family: Family;

    public constructor(world: World) {
        super();

        this.family = new FamilyBuilder(world)
            .include(Object3DComponent)
            .include(PositionComponent)
            .build();

        this.initEntityMesh(world);
    }

    private initEntityMesh(world: World) {
        const onEntityAdded = (entity: Entity) => {
            if (entity.hasComponent(Object3DComponent)) {
                const object = entity.getComponent(Object3DComponent);

                if (entity.hasComponent(MeshComponent)) {
                    const mesh = entity.getComponent(MeshComponent);
                    new GltfLoader().load(mesh.src, glb => {
                        glb.scene.traverse(child => {
                            if (child instanceof Mesh) {
                                mesh.mesh = child;
                            }
                        });
                        object.add(mesh.mesh);
                    });
                }

                world.scene.add(object);
            }
        };

        const onEntityRemoved = (entity: Entity) => {
            if (entity.hasComponent(Object3DComponent)) {
                const object = entity.getComponent(Object3DComponent);
                world.scene.remove(object);
            }
        };

        world.addEntityListener({ onEntityAdded, onEntityRemoved });
    }

    public update(world: World) {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const object = entity.getComponent(Object3DComponent);

            const position = entity.getComponent(PositionComponent);
            object.position.set(position.x, position.y, position.z);

            if (entity.hasComponent(RotationComponent)) {
                const rotation = entity.getComponent(RotationComponent);
                object.rotation.set(rotation.x, rotation.y, 0, "YXZ");
            }

            if (entity.hasComponent(MeshComponent)) {
                const mesh = entity.getComponent(MeshComponent);
                const cell = world.level.getCell(
                    Math.round(position.x),
                    Math.round(position.z)
                );

                if (cell !== undefined && !mesh.color.equals(cell.light)) {
                    mesh.color.copy(cell.light);
                    if (mesh.mesh.material instanceof MeshBasicMaterial) {
                        mesh.mesh.material.color.lerp(cell.light, 0.125);
                        mesh.mesh.material.needsUpdate = true;
                    }
                }
            }
        }
    }
}
