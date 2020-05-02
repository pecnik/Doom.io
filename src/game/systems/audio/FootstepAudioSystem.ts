import { System } from "../../ecs";
import { random } from "lodash";
import { AvatarArchetype } from "../../ecs/Archetypes";
import { Sound3D } from "../../sound/Sound3D";

export class FootstepAudioSystem extends System {
    private readonly family = this.createEntityFamily({
        archetype: new AvatarArchetype(),
    });

    public update() {
        this.family.entities.forEach((entity) => {
            const { velocity, collision } = entity;
            if (Math.abs(velocity.x) < 2 && Math.abs(velocity.z) < 2) {
                return;
            }

            if (collision.falg.y !== -1) {
                return;
            }

            const delta = this.world.elapsedTime - entity.footstep.stepTime;
            if (delta < 0.5) {
                return;
            }

            entity.footstep.stepTime = this.world.elapsedTime;

            const footstepSound = Sound3D.get("/assets/sounds/footstep.wav");
            footstepSound.emitFrom(entity, (audio) => {
                audio.detune = random(100, 600);
                audio.setVolume(random(0.5, 1, true));
            });
        });
    }
}
