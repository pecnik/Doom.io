import { System } from "../ecs";
import { lerp } from "../core/Utils";
import { isScopeActive, getHeadPosition } from "../Helpers";
import { LocalAvatarArchetype } from "../ecs/Archetypes";
import { random } from "lodash";

export class PlayerCameraSystem extends System {
    private readonly family = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    public update() {
        const avatar = this.family.first();
        if (avatar === undefined) return;

        const position = getHeadPosition(avatar);
        const rotation = avatar.rotation;

        const { camera } = this.world;
        camera.rotation.set(rotation.x, rotation.y, 0, "YXZ");
        camera.position.copy(position);

        const fov = isScopeActive(avatar) ? 60 : 90;
        if (camera.fov !== fov) {
            camera.fov = lerp(camera.fov, fov, 10);
            camera.updateProjectionMatrix();
        }

        if (avatar.cameraShake.lengthSq() > 0.01) {
            const range = 0.01;
            const { x, y, z } = avatar.cameraShake;
            this.world.camera.rotation.x += x * random(-range, range, true);
            this.world.camera.rotation.y += y * random(-range, range, true);
            this.world.camera.rotation.z += z * random(-range, range, true);
            avatar.cameraShake.multiplyScalar(0.95);
        }
    }
}
