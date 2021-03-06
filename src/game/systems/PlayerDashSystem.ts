import { System } from "../ecs";
import { lerp } from "../core/Utils";
import { LocalAvatarArchetype } from "../ecs/Archetypes";
import { Vector2 } from "three";
import { RUN_SPEED, JUMP_SPEED, DASH_CHARGE } from "../data/Globals";
import { GameClient } from "../GameClient";
import { getMoveDirection } from "../Helpers";
import { Action } from "../Action";

export class PlayerDashSystem extends System<GameClient> {
    private readonly family = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    public update(dt: number) {
        this.family.entities.forEach((avatar) => {
            if (avatar.jump.dashCharge < DASH_CHARGE) {
                avatar.jump.dashCharge = lerp(
                    avatar.jump.dashCharge,
                    DASH_CHARGE,
                    0.25 * dt
                );
            }

            if (avatar.input.dash && avatar.jump.dashCharge > 1) {
                avatar.jump.dashing = true;
                avatar.jump.dashTime = this.world.elapsedTime;
                avatar.jump.dashCharge -= 0.9;

                // Accelerate
                const dashSpeed = RUN_SPEED * 5;
                const move = getMoveDirection(avatar);
                move.multiplyScalar(dashSpeed);
                if (move.x === 0 && move.y === 0) {
                    move.set(0, -1);
                    move.rotateAround(new Vector2(), -avatar.rotation.y);
                    move.multiplyScalar(dashSpeed);
                }

                avatar.velocity.x = move.x;
                avatar.velocity.z = move.y;
                avatar.velocity.y = JUMP_SPEED * 0.1;

                this.game.dispatch(
                    Action.playSound(avatar.id, "/assets/sounds/whoosh.wav")
                );
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
