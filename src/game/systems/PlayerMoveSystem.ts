import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { World } from "../data/World";
import { Comp } from "../data/Comp";
import { Vector2 } from "three";
import { WALK_SPEED, RUN_SPEED } from "../data/Globals";
import { lerp } from "../core/Utils";
import { isScopeActive } from "../utils/EntityUtils";

export class PlayerMoveSystem extends System {
    private readonly family: Family;

    public constructor(world: World) {
        super();
        this.family = new FamilyBuilder(world)
            .include(Comp.PlayerInput)
            .include(Comp.Position2D)
            .include(Comp.Velocity2D)
            .include(Comp.Rotation2D)
            .build();
    }

    public update(_: World, dt: number) {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const position = entity.getComponent(Comp.Position2D);
            const velocity = entity.getComponent(Comp.Velocity2D);

            const move = this.getMoveVector(entity);
            velocity.x = lerp(velocity.x, move.x, RUN_SPEED / 8);
            velocity.y = lerp(velocity.y, move.y, RUN_SPEED / 8);

            position.x += velocity.x * dt;
            position.y += velocity.y * dt;
        }
    }

    private getMoveVector(entity: Entity) {
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
