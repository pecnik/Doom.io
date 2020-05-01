import { System } from "../ecs";
import { Vector2 } from "three";
import { WALK_SPEED, RUN_SPEED, JUMP_SPEED } from "../data/Globals";
import { lerp } from "../core/Utils";
import { isScopeActive, isCrouched } from "../Helpers";
import { LocalAvatarArchetype } from "../ecs/Archetypes";

export class PlayerMoveSystem extends System {
    private readonly family = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    public update() {
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
            }

            const tdelta = elapsed - jump.triggerTime;
            const cdelta = elapsed - jump.coyoteTime;
            if (tdelta < 0.1 && cdelta < 0.1) {
                velocity.y = JUMP_SPEED;
                jump.triggerTime = 0;
                jump.coyoteTime = 0;
            }

            // horizontal movement
            const move = new Vector2(input.movex, input.movey);
            move.normalize();

            const slow = isCrouched(entity) || isScopeActive(entity);
            const speed = slow ? WALK_SPEED : RUN_SPEED;
            move.multiplyScalar(speed);
            if (move.x !== 0 || move.y !== 0) {
                move.rotateAround(new Vector2(), -rotation.y);
            }

            const acc = isGrounded ? RUN_SPEED * 0.25 : RUN_SPEED * 0.005;
            velocity.x = lerp(velocity.x, move.x, acc);
            velocity.z = lerp(velocity.z, move.y, acc);
        });
    }
}
