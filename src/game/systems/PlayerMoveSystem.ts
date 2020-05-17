import { System } from "../ecs";
import { Vector2 } from "three";
import { WALK_SPEED, RUN_SPEED, JUMP_SPEED } from "../data/Globals";
import { lerp } from "../core/Utils";
import { isScopeActive, isCrouched } from "../Helpers";
import { LocalAvatarArchetype } from "../ecs/Archetypes";
import { Sound2D } from "../sound/Sound2D";

export class PlayerMoveSystem extends System {
    private readonly family = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    public update(dt: number) {
        this.family.entities.forEach((entity) => {
            const jump = entity.jump;
            const input = entity.input;
            const rotation = entity.rotation;
            const velocity = entity.velocity;
            const collision = entity.collision;

            // Jumping
            const elapsed = this.world.elapsedTime;
            const isGrounded = collision.falg.y === -1;
            if (input.jump) {
                jump.triggerTime = elapsed;
            }

            if (isGrounded) {
                jump.coyoteTime = elapsed;
                jump.doubleJump = true;
            }

            const tdelta = elapsed - jump.triggerTime;
            const cdelta = elapsed - jump.coyoteTime;
            if (tdelta < 0.1) {
                if (cdelta < 0.1) {
                    velocity.y = JUMP_SPEED;
                    jump.triggerTime = 0;
                    jump.coyoteTime = 0;
                } else if (jump.doubleJump) {
                    velocity.y = JUMP_SPEED * 1.25;
                    jump.triggerTime = 0;
                    jump.coyoteTime = 0;
                    jump.doubleJump = false;
                    Sound2D.get("/assets/sounds/double_jump.wav").play();
                }
            }

            if (!entity.jump.dashing) {
                let targetSpeed = RUN_SPEED;
                if (input.movex === 0 && input.movey === 0) {
                    targetSpeed = 0;
                } else if (isCrouched(entity) || isScopeActive(entity)) {
                    targetSpeed = WALK_SPEED;
                }

                const lerpSpeed = RUN_SPEED * dt * 4;
                entity.jump.speed = lerp(
                    entity.jump.speed,
                    targetSpeed,
                    lerpSpeed
                );

                // horizontal movement
                const move = new Vector2(input.movex, input.movey);
                if (targetSpeed === 0) {
                    move.x = entity.velocity.x;
                    move.y = entity.velocity.z;
                    move.normalize();
                    move.multiplyScalar(entity.jump.speed);
                } else {
                    move.normalize();
                    move.rotateAround(new Vector2(), -rotation.y);
                    move.multiplyScalar(entity.jump.speed);
                }

                if (isGrounded) {
                    entity.velocity.x = move.x;
                    entity.velocity.z = move.y;
                } else {
                    const velocity = new Vector2(
                        entity.velocity.x,
                        entity.velocity.z
                    );
                    velocity.lerp(move, dt * 2);
                    entity.velocity.x = velocity.x;
                    entity.velocity.z = velocity.y;
                }
            }
        });
    }
}
