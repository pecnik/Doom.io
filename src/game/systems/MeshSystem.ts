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
            .include(Object3DComponent)
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

            if (entity.hasComponent(PositionComponent)) {
                const position = entity.getComponent(PositionComponent);
                object.position.set(position.x, position.y, position.z);
            }

            if (entity.hasComponent(RotationComponent)) {
                const rotation = entity.getComponent(RotationComponent);
                object.rotation.set(rotation.x, rotation.y, 0, "YXZ");
            }
        }
    }
}
