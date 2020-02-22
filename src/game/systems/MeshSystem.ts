import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { World } from "../World";
import {
    RotationComponent,
    PositionComponent,
    ModelComponent
} from "../Components";
import { Mesh, CylinderGeometry, MeshBasicMaterial } from "three";

export class MeshSystem extends System {
    private readonly family: Family;

    public constructor(world: World) {
        super();
        this.family = new FamilyBuilder(world)
            .include(PositionComponent)
            .include(RotationComponent)
            .include(ModelComponent)
            .build();

        world.addEntityListener({
            onEntityAdded: (entity: Entity) => {
                if (this.family.includesEntity(entity)) {
                    const model = new Mesh(
                        new CylinderGeometry(0.25, 0.25, 1, 8),
                        new MeshBasicMaterial({ wireframe: true })
                    );
                    model.name = entity.id as string;
                    world.scene.add(model);
                }
            },
            onEntityRemoved: (entity: Entity) => {
                if (this.family.includesEntity(entity)) {
                    const model = world.scene.getObjectByName(
                        entity.id as string
                    );

                    if (model !== undefined) {
                        world.scene.remove(model);
                    }
                }
            }
        });
    }

    public update(world: World) {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const model = world.scene.getObjectByName(entity.id as string);
            if (model !== undefined) {
                const position = entity.getComponent(PositionComponent);
                const rotation = entity.getComponent(RotationComponent);
                model.position.set(position.x, position.y, position.z);
                model.rotation.y = rotation.y;
            }
        }
    }
}
