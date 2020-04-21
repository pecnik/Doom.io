import { System, AnyComponents } from "../ecs";
import { World } from "../ecs";
import { Comp } from "../ecs";
import { Vector2 } from "three";
import { WALK_SPEED, RUN_SPEED, GRAVITY, JUMP_SPEED } from "../data/Globals";
import { lerp } from "../core/Utils";
import { isScopeActive, isCrouched } from "../Helpers";

class Archetype implements AnyComponents {
    public jump = new Comp.Jump();
    public input = new Comp.PlayerInput();
    public shooter = new Comp.Shooter();
    public position = new Comp.Position();
    public velocity = new Comp.Velocity();
    public rotation = new Comp.Rotation2D();
    public collision = new Comp.Collision();
}

export class PlayerMoveSystem extends System {
    private readonly family = this.createEntityFamily({
        archetype: new Archetype(),
    });

    public update(world: World, dt: number) {
        this.family.entities.forEach((entity) => {
            const jump = entity.jump;
            const input = entity.input;
            const position = entity.position;
            const rotation = entity.rotation;
            const velocity = entity.velocity;
            const collision = entity.collision;

            // Jumping
            const elapsed = world.elapsedTime;
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

            // Apply gravity
            velocity.y -= GRAVITY * dt;

            // Apply velocity
            position.x += velocity.x * dt;
            position.y += velocity.y * dt;
            position.z += velocity.z * dt;
        });
    }
}
