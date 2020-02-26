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

        this.initEntityMesh(world);
    }

    private initEntityMesh(world: World) {
        const geo = new CylinderGeometry(0.25, 0.25, 1, 8);
        const mat = new MeshBasicMaterial({ wireframe: true });
        const onEntityAdded = (entity: Entity) => {
            if (entity.hasComponent(Object3DComponent)) {
                const object = entity.getComponent(Object3DComponent);
                if (entity.hasComponent(MeshComponent)) {
                    object.add(new Mesh(geo, mat));
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
