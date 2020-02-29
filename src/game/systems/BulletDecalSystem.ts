import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { World } from "../World";
import {
    PositionComponent,
    BulletDecalComponent,
    NormalComponent
} from "../Components";
import {
    Group,
    Mesh,
    MeshBasicMaterial,
    PlaneGeometry,
    TextureLoader,
    NearestFilter
} from "three";
import { degToRad } from "../core/Utils";

export class BulletDecalSystem extends System {
    private readonly family: Family;
    private readonly group: Group;

    public constructor(world: World) {
        super();

        this.group = new Group();

        this.family = new FamilyBuilder(world)
            .include(BulletDecalComponent)
            .include(PositionComponent)
            .include(NormalComponent)
            .build();

        const pixel = 1 / 64;

        new TextureLoader().load("/assets/sprites/bullet_decal.png", map => {
            const size = pixel * 8;
            const geometry = new PlaneGeometry(size, size, size);

            // Fill pool
            for (let i = 0; i < 16; i++) {
                const material = new MeshBasicMaterial({
                    map,
                    opacity: 1,
                    transparent: true
                });
                map.minFilter = NearestFilter;
                map.magFilter = NearestFilter;

                const mesh = new Mesh(geometry, material);
                mesh.visible = false;
                this.group.add(mesh);
            }
        });

        const onEntityAdded = (entity: Entity) => {
            if (!this.family.includesEntity(entity)) {
                return;
            }

            const mesh = this.group.children.find(m => !m.visible) as Mesh;
            if (mesh === undefined) return;

            const decal = entity.getComponent(BulletDecalComponent);
            decal.mesh = mesh;
            decal.mesh.visible = true;
            decal.spawnTime = world.elapsedTime;

            const position = entity.getComponent(PositionComponent);
            mesh.position.set(position.x, position.y, position.z);
            mesh.rotation.set(0, 0, 0);

            const offset = 1 / 1024;
            const normal = entity.getComponent(NormalComponent);
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

            const decal = entity.getComponent(BulletDecalComponent);
            decal.mesh.visible = false;
        };

        world.addEntityListener({ onEntityAdded, onEntityRemoved });
        world.scene.add(this.group);
    }

    public update(world: World) {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const decal = entity.getComponent(BulletDecalComponent);

            const lifetime = world.elapsedTime - decal.spawnTime;
            const material = decal.mesh.material as MeshBasicMaterial;
            material.opacity = 1 - lifetime / 2;
            if (material.opacity < 0.01) {
                world.removeEntities(entity);
            }
        }
    }
}
