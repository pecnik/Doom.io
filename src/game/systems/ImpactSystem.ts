import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { World } from "../World";
import { PositionComponent, ImpactTag, NormalComponent } from "../Components";
import { Group, Mesh, MeshBasicMaterial, PlaneGeometry } from "three";
import { degToRad } from "../core/Utils";

export class ImpactSystem extends System {
    private readonly family: Family;
    private readonly group: Group;

    public constructor(world: World) {
        super();

        this.group = new Group();

        this.family = new FamilyBuilder(world)
            .include(ImpactTag)
            .include(PositionComponent)
            .include(NormalComponent)
            .build();

        const pixel = 1 / 64;
        const size = pixel * 2;
        const geo = new PlaneGeometry(size, size, size);
        const mat = new MeshBasicMaterial({ color: 0xffff00 });
        const onEntityAdded = (entity: Entity) => {
            if (!this.family.includesEntity(entity)) {
                return;
            }

            const position = entity.getComponent(PositionComponent);
            const normal = entity.getComponent(NormalComponent);

            const mesh = new Mesh(geo, mat);
            mesh.position.set(position.x, position.y, position.z);

            const offset = 0.01;
            mesh.position.x += normal.x * offset;
            mesh.position.y += normal.y * offset;
            mesh.position.z += normal.z * offset;

            if (normal.x !== 0) {
                mesh.rotation.y = degToRad(90) * normal.x;

                mesh.position.z = Math.round(mesh.position.z / pixel) * pixel;
                mesh.position.y = Math.round(mesh.position.y / pixel) * pixel;
            }

            if (normal.y !== 0) {
                mesh.rotation.x = degToRad(-90) * normal.y;

                mesh.position.x = Math.round(mesh.position.x / pixel) * pixel;
                mesh.position.z = Math.round(mesh.position.z / pixel) * pixel;
            }

            if (normal.z === -1) {
                mesh.rotation.y = degToRad(180);

                mesh.position.x = Math.round(mesh.position.x / pixel) * pixel;
                mesh.position.y = Math.round(mesh.position.y / pixel) * pixel;
            }

            this.group.add(mesh);
        };

        const onEntityRemoved = (entity: Entity) => {
            if (!this.family.includesEntity(entity)) {
                return;
            }
        };

        world.addEntityListener({ onEntityAdded, onEntityRemoved });
        world.scene.add(this.group);
    }

    public update() {
        // ...
    }
}
