import { System, Family, FamilyBuilder } from "../core/ecs";
import { World } from "../data/World";
import { Comp } from "../data/Comp";
import { Vector2 } from "three";
import { WALK_SPEED, RUN_SPEED, GRAVITY, JUMP_SPEED } from "../data/Globals";
import { lerp } from "../core/Utils";
import { isScopeActive } from "../utils/Helpers";

export class PlayerMoveSystem extends System {
    private readonly family: Family;

    public constructor(world: World) {
        super();
        this.family = new FamilyBuilder(world)
            .include(Comp.PlayerInput)
            .include(Comp.Position)
            .include(Comp.Velocity)
            .include(Comp.Rotation2D)
            .include(Comp.Collision)
            .build();
    }

    public update(world: World, dt: number) {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const jump = entity.getComponent(Comp.Jump);
            const input = entity.getComponent(Comp.PlayerInput);
            const position = entity.getComponent(Comp.Position);
            const rotation = entity.getComponent(Comp.Rotation2D);
            const velocity = entity.getComponent(Comp.Velocity);
            const collision = entity.getComponent(Comp.Collision);

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

            const scope = isScopeActive(entity);
            const speed = input.crouch || scope ? WALK_SPEED : RUN_SPEED;
            move.multiplyScalar(speed);
            if (move.x !== 0 || move.y !== 0) {
                move.rotateAround(new Vector2(), -rotation.y);
            }

            const acc = isGrounded ? RUN_SPEED * 0.25 : RUN_SPEED * 0.005;
            velocity.x = lerp(velocity.x, move.x, acc);
            velocity.z = lerp(velocity.z, move.y, acc);

            // bounce
            if (collision.falg.y === -1 && velocity.y <= 0) {
                const voxel = world.level.getVoxelAt(position);
                if (voxel && voxel.bounce > 0) {
                    velocity.y = JUMP_SPEED * Math.sqrt(voxel.bounce);
                }
            }

            // Apply gravity
            velocity.y -= GRAVITY * dt;

            // Apply velocity
            position.x += velocity.x * dt;
            position.y += velocity.y * dt;
            position.z += velocity.z * dt;
        }
    }
}
