import { System, Components } from "../../ecs";
import { Object3D } from "three";
import GLTFLoader from "three-gltf-loader";
import { getEntityMesh } from "../../Helpers";

export class EntityMeshSystem extends System {
    private readonly group = this.createSceneGroup();
    private readonly family = this.createEntityFamily({
        archetype: {
            entityMesh: new Components.EntityMesh(),
        },

        onEntityAdded: (entity) => {
            const meshname = entity.entityMesh.src + "_mesh";

            let obj = this.group.children.find((obj) => {
                if (obj.visible) return false;
                if (obj.name !== meshname) return false;
                return true;
            });

            if (obj === undefined) {
                const newobj = new Object3D();
                newobj.name = meshname;
                this.group.add(newobj);

                new GLTFLoader().load(entity.entityMesh.src, (glb) => {
                    newobj.add(glb.scene);
                });

                obj = newobj;
            }

            entity.entityMesh.objectId = obj.id;
            obj.visible = true;
        },

        onEntityRemvoed: (entity) => {
            const obj = this.group.getObjectById(entity.entityMesh.objectId);
            if (obj !== undefined) {
                obj.visible = false;
            }
        },
    });

    public update() {
        this.family.entities.forEach((entity) => {
            const mesh = getEntityMesh(this.world, entity);
            if (mesh === undefined) return;

            if (entity.position !== undefined) {
                mesh.position.copy(entity.position);
            }
        });
    }
}
