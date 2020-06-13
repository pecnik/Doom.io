import { System, Entity } from "../../ecs";
import { PickupArchetype } from "../../ecs/Archetypes";
import { disposeMeshMaterial } from "../../Helpers";
import {
    InstancedMesh,
    Mesh,
    Object3D,
    MeshBasicMaterial,
    BoxGeometry,
} from "three";
import GLTFLoader from "three-gltf-loader";
import { MAX_PICKUP_COUNT } from "../../data/Globals";
import { WeaponType, WEAPON_SPEC_RECORD } from "../../data/Weapon";

enum PickupType {
    Pistol = WeaponType.Pistol,
    Plasma = WeaponType.Plasma,
    Shotgun = WeaponType.Shotgun,
    Machinegun = WeaponType.Machinegun,
    HealthPack,
}

export class PickupMeshSystem extends System {
    private readonly dummy = new Object3D();

    private readonly family = this.createEntityFamily({
        archetype: new PickupArchetype(),
    });

    private pickupMeshes = (() => {
        const geo = new BoxGeometry(0.25, 0.25, 0.25);
        const mat = new MeshBasicMaterial({ color: 0xff00ff });
        const count = MAX_PICKUP_COUNT;

        class PickupInstancedMesh extends InstancedMesh {
            public readonly pickupType: PickupType;
            public index = 0;

            public constructor(pickupType: PickupType) {
                super(geo, mat, count);
                this.pickupType = pickupType;
            }

            public loadMeshData(src: string) {
                new GLTFLoader().load(src, (glb) => {
                    let mesh: Mesh | undefined;
                    glb.scene.traverse((child) => {
                        if (child instanceof Mesh) {
                            mesh = child;
                        }
                    });

                    if (mesh !== undefined) {
                        disposeMeshMaterial(this.material);
                        this.geometry.dispose();
                        this.geometry = mesh.geometry;
                        this.material = mesh.material;
                    }
                });
            }
        }

        const create = (config: { type: PickupType; src: string }) => {
            const instancedMesh = new PickupInstancedMesh(config.type);
            instancedMesh.loadMeshData(config.src);
            this.world.scene.add(instancedMesh);
            return instancedMesh;
        };

        return [
            create({
                type: PickupType.Pistol,
                src: WEAPON_SPEC_RECORD[WeaponType.Pistol].ammoPickupMesh,
            }),
            create({
                type: PickupType.Plasma,
                src: WEAPON_SPEC_RECORD[WeaponType.Plasma].ammoPickupMesh,
            }),
            create({
                type: PickupType.Shotgun,
                src: WEAPON_SPEC_RECORD[WeaponType.Shotgun].ammoPickupMesh,
            }),
            create({
                type: PickupType.Machinegun,
                src: WEAPON_SPEC_RECORD[WeaponType.Machinegun].ammoPickupMesh,
            }),
            create({
                type: PickupType.HealthPack,
                src: "/assets/mesh/healt_pickup.gltf",
            }),
        ];
    })();

    private getPickupType(entity: Entity): PickupType {
        if (entity.pickupAmmo === undefined) return PickupType.HealthPack;

        switch (entity.pickupAmmo.weaponType) {
            case WeaponType.Pistol:
                return PickupType.Pistol;

            case WeaponType.Plasma:
                return PickupType.Plasma;

            case WeaponType.Shotgun:
                return PickupType.Shotgun;

            case WeaponType.Machinegun:
                return PickupType.Machinegun;
        }
    }

    public update(dt: number) {
        // Reset all pickups instances
        this.dummy.position.set(0, -Number.MAX_SAFE_INTEGER, 0);
        this.dummy.updateMatrix();
        this.pickupMeshes.forEach((pickupMesh) => {
            pickupMesh.index = 0;
            pickupMesh.instanceMatrix.needsUpdate = true;
            for (let i = 0; i < pickupMesh.count; i++) {
                pickupMesh.setMatrixAt(i, this.dummy.matrix);
            }
        });

        // Update dummy rotation
        const offsety = Math.sin(this.dummy.rotation.y * 3) * 0.05 + 0.1;
        this.dummy.rotation.y += 2 * dt;
        this.dummy.rotation.y %= Math.PI * 2;

        // Apply position & rotation
        this.family.entities.forEach((pickup) => {
            const pickupType = this.getPickupType(pickup);
            const pickupMesh = this.pickupMeshes.find((p) => {
                return p.pickupType === pickupType;
            });

            if (pickupMesh === undefined) return;

            this.dummy.position.copy(pickup.position);
            this.dummy.position.y += offsety;
            this.dummy.updateMatrix();

            pickupMesh.setMatrixAt(pickupMesh.index, this.dummy.matrix);
            pickupMesh.index++;
        });
    }
}
