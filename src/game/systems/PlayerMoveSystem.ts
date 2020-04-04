import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { World } from "../data/World";
import { Comp } from "../data/Comp";
import { Vector2 } from "three";
import { WALK_SPEED, RUN_SPEED, GRAVITY, JUMP_SPEED } from "../data/Globals";
import { lerp } from "../core/Utils";
import { isScopeActive } from "../utils/EntityUtils";

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

    public update(_: World, dt: number) {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const position = entity.getComponent(Comp.Position);
            const velocity = entity.getComponent(Comp.Velocity);
            const collision = entity.getComponent(Comp.Collision);

            // horizontal movement
            const move = this.getMoveVector(entity);
            velocity.x = lerp(velocity.x, move.x, RUN_SPEED / 8);
            velocity.z = lerp(velocity.z, move.y, RUN_SPEED / 8);

            // Jump
            const { jump } = entity.getComponent(Comp.PlayerInput);
            if (jump && collision.falg.y === -1) {
                velocity.y = JUMP_SPEED;
            }

            // Apply gravity
            velocity.y -= GRAVITY * dt;

            // Apply velocity
            position.x += velocity.x * dt;
            position.y += velocity.y * dt;
            position.z += velocity.z * dt;
        }
    }

    private getMoveVector(entity: Entity): Vector2 {
        const input = entity.getComponent(Comp.PlayerInput);
        const rotation = entity.getComponent(Comp.Rotation2D);

        const move = new Vector2(input.movex, input.movey);
        move.normalize();

        const scope = isScopeActive(entity);
        const speed = input.walk || scope ? WALK_SPEED : RUN_SPEED;
        move.multiplyScalar(speed);
        if (move.x !== 0 || move.y !== 0) {
            move.rotateAround(new Vector2(), -rotation.y);
        }

        return move;
    }
}
