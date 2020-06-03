import { System } from "../ecs";
import { lerp } from "../core/Utils";
import { isScopeActive, getHeadPosition } from "../Helpers";
import { LocalAvatarArchetype } from "../ecs/Archetypes";
import { Vector3 } from "three";
import { random } from "lodash";

export class PlayerCameraSystem extends System {
    private readonly family = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    private readonly cameraShake = new Vector3(); // TODO: mybe export as component data?

    public update() {
        this.family.entities.forEach((entity) => {
            const position = getHeadPosition(entity);
            const rotation = entity.rotation;

            const { camera } = this.world;
            camera.rotation.set(rotation.x, rotation.y, 0, "YXZ");
            camera.position.copy(position);

            const fov = isScopeActive(entity) ? 60 : 90;
            if (camera.fov !== fov) {
                camera.fov = lerp(camera.fov, fov, 10);
                camera.updateProjectionMatrix();
            }

            const delta = this.world.elapsedTime - entity.hitIndicator.time;
            if (entity.hitIndicator.show && delta < 0.5) {
                this.cameraShake.setScalar(1);
            }

            if (this.cameraShake.x > 0.01) {
                const range = 0.01;
                const { x, y, z } = this.cameraShake;
                this.world.camera.rotation.x += x * random(-range, range, true);
                this.world.camera.rotation.y += y * random(-range, range, true);
                this.world.camera.rotation.z += z * random(-range, range, true);
                this.cameraShake.multiplyScalar(0.95);
            }
        });
    }
}
