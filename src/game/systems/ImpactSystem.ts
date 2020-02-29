import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { World } from "../World";
import { PositionComponent, ImpactTag, NormalComponent } from "../Components";
import {
    Group,
    Mesh,
    MeshBasicMaterial,
    PlaneGeometry,
    TextureLoader,
    NearestFilter,
    MultiplyBlending
} from "three";
import { degToRad } from "../core/Utils";

export class ImpactSystem extends System {
    private readonly family: Family;
    private readonly group: Group;
    private ringBufferIndex = 0;

    public constructor(world: World) {
        super();

        this.group = new Group();

        this.family = new FamilyBuilder(world)
            .include(ImpactTag)
            .include(PositionComponent)
            .include(NormalComponent)
            .build();

        const pixel = 1 / 64;

        new TextureLoader().load("/assets/sprites/bullet_decal.png", map => {
            const size = pixel * 8;
            const geometry = new PlaneGeometry(size, size, size);
            const material = new MeshBasicMaterial({
                map,
                blending: MultiplyBlending
            });
            map.minFilter = NearestFilter;
            map.magFilter = NearestFilter;

            // Fill pool
            for (let i = 0; i < 32; i++) {
                const mesh = new Mesh(geometry, material);
                mesh.visible = false;
                this.group.add(mesh);
            }
        });

        const onEntityAdded = (entity: Entity) => {
            if (!this.family.includesEntity(entity)) {
                return;
            }

            this.ringBufferIndex += 1;
            this.ringBufferIndex %= this.group.children.length - 1;

            const position = entity.getComponent(PositionComponent);
            const normal = entity.getComponent(NormalComponent);

            const mesh = this.group.children[this.ringBufferIndex];
            mesh.visible = true;
            mesh.position.set(position.x, position.y, position.z);
            mesh.rotation.set(0, 0, 0);

            const offset = (1 / 256) * this.ringBufferIndex;
            mesh.position.x += normal.x * offset;
            mesh.position.y += normal.y * offset;
            mesh.position.z += normal.z * offset;

            // Rotate to match wall
            if (normal.x !== 0) {
                mesh.rotation.y = degToRad(90) * normal.x;
            }

            if (normal.y !== 0) {
                mesh.rotation.x = degToRad(-90) * normal.y;
            }

            if (normal.z === -1) {
                mesh.rotation.y = degToRad(180);
            }

            // Fit to pixel grid
            const fitToPixelGrid = true;
            if (fitToPixelGrid) {
                const round = (x: number) => Math.round(x / pixel) * pixel;

                if (normal.x !== 0) {
                    mesh.position.z = round(mesh.position.z);
                    mesh.position.y = round(mesh.position.y);
                }

                if (normal.y !== 0) {
                    mesh.position.x = round(mesh.position.x);
                    mesh.position.z = round(mesh.position.z);
                }

                if (normal.z === -1) {
                    mesh.position.x = round(mesh.position.x);
                    mesh.position.y = round(mesh.position.y);
                }
            }
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
