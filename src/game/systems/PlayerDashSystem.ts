import { System } from "../ecs";
import { lerp } from "../core/Utils";
import { LocalAvatarArchetype } from "../ecs/Archetypes";
import { Vector2 } from "three";
import { RUN_SPEED, JUMP_SPEED } from "../data/Globals";
import { Sound2D } from "../sound/Sound2D";

export class PlayerDashSystem extends System {
    private readonly family = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    public update(dt: number) {
        this.family.entities.forEach((avatar) => {
            if (avatar.jump.dashCharge < 2) {
                avatar.jump.dashCharge = lerp(
                    avatar.jump.dashCharge,
                    2,
                    0.1 * dt
                );
            }

            if (avatar.input.dash && avatar.jump.dashCharge > 1) {
                avatar.jump.dashing = true;
                avatar.jump.dashTime = this.world.elapsedTime;
                avatar.jump.dashCharge -= 1;

                // Accelerate
                const dashSpeed = RUN_SPEED * 5;
                const move = new Vector2(0, -dashSpeed);
                if (move.x !== 0 || move.y !== 0) {
                    move.rotateAround(new Vector2(), -avatar.rotation.y);
                }

                avatar.velocity.x = move.x;
                avatar.velocity.z = move.y;
                avatar.velocity.y = JUMP_SPEED * 0.1;
                Sound2D.get("/assets/sounds/whoosh.wav").play();
            }

            // Halt
            const dashDelta = this.world.elapsedTime - avatar.jump.dashTime;
            if (avatar.jump.dashing && dashDelta > 0.2) {
                avatar.jump.dashing = false;
                avatar.velocity.x *= 0.1;
                avatar.velocity.z *= 0.1;
            }
        });
    }
}
