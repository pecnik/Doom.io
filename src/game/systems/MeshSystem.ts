import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { World } from "../World";
import {
    RotationComponent,
    PositionComponent,
    MeshComponent,
    Object3DComponent
} from "../Components";
import { Mesh, CylinderGeometry, MeshBasicMaterial } from "three";

export class MeshSystem extends System {
    private readonly family: Family;

    public constructor(world: World) {
        super();
        this.family = new FamilyBuilder(world)
            .include(PositionComponent)
            .include(RotationComponent)
            .include(Object3DComponent)
            .include(MeshComponent)
            .build();

        world.addEntityListener({
            onEntityAdded: (entity: Entity) => {
                if (this.family.includesEntity(entity)) {
                    const object = entity.getComponent(Object3DComponent);
                    const mesh = entity.getComponent(MeshComponent);
                    mesh.instance = new Mesh(
                        new CylinderGeometry(0.25, 0.25, 1, 8),
                        new MeshBasicMaterial({ wireframe: true })
                    );

                    object.add(mesh.instance);
                    world.scene.add(object);
                }
            },
            onEntityRemoved: (entity: Entity) => {
                if (this.family.includesEntity(entity)) {
                    const object = entity.getComponent(Object3DComponent);
                    world.scene.remove(object);
                }
            }
        });
    }

    public update() {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const object = entity.getComponent(Object3DComponent);
            const position = entity.getComponent(PositionComponent);
            const rotation = entity.getComponent(RotationComponent);
            object.position.set(position.x, position.y, position.z);
            object.rotation.y = rotation.y;
        }
    }
}
