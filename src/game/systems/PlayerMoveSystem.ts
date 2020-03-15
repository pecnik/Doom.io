import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { World } from "../data/World";
import { Comp } from "../data/Comp";
import { Vector2 } from "three";
import { WALK_SPEED, RUN_SPEED } from "../data/Globals";
import { lerp } from "../core/Utils";

export class PlayerMoveSystem extends System {
    private readonly family: Family;

    public constructor(world: World) {
        super();
        this.family = new FamilyBuilder(world)
            .include(Comp.PlayerInput)
            .include(Comp.Velocity2D)
            .include(Comp.Rotation2D)
            .build();
    }

    public update(_: World, dt: number) {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const input = entity.getComponent(Comp.PlayerInput);
            const position = entity.getComponent(Comp.Position2D);
            const velocity = entity.getComponent(Comp.Velocity2D);
            const rotation = entity.getComponent(Comp.Rotation2D);

            const move = this.getMoveVector(input, rotation);
            velocity.x = lerp(velocity.x, move.x, RUN_SPEED / 8);
            velocity.y = lerp(velocity.y, move.y, RUN_SPEED / 8);

            position.x += velocity.x * dt;
            position.y += velocity.y * dt;
        }
    }

    private getMoveVector(input: Comp.PlayerInput, rotation: Comp.Rotation2D) {
        const move = new Vector2(input.movex, input.movey);
        move.normalize();

        const speed = input.walk ? WALK_SPEED : RUN_SPEED;
        move.multiplyScalar(speed);
        if (move.x !== 0 || move.y !== 0) {
            move.rotateAround(new Vector2(), -rotation.y);
        }

        return move;
    }
}
