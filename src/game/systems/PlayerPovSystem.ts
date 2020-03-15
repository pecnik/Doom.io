import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { World } from "../data/World";
import { Comp } from "../data/Comp";
import { PovState, Pov } from "../utils/Pov";
import { lerp, ease } from "../core/Utils";
import { Vector3 } from "three";

export class PlayerPovSystem extends System {
    public readonly family: Family;

    public constructor(world: World) {
        super();

        this.family = new FamilyBuilder(world)
            .include(Comp.PlayerInput)
            .include(Comp.Velocity2D)
            .include(Comp.Shooter)
            .build();
    }

    public update(world: World) {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const position = entity.getComponent(Comp.Position2D);

            // Update light color tint
            const sprite = world.pov.weapon.material;
            const cell = world.level.getCell(
                Math.round(position.x),
                Math.round(position.y)
            );

            if (cell !== undefined && !sprite.color.equals(cell.light)) {
                sprite.color.lerp(cell.light, 0.125);
                sprite.needsUpdate = true;
            }

            // Update pov state
            const prevState = world.pov.state;
            const nextState = this.getState(world, entity);

            if (world.pov.transition > 0) {
                world.pov.transition = lerp(world.pov.transition, 0, 0.05);
            }

            if (prevState !== nextState) {
                world.pov.state = nextState;
                world.pov.transition = 1;
            }

            const frame = this.getFrame(world.pov, world.elapsedTime);
            if (world.pov.state === PovState.Shoot) {
                world.pov.transition = 0;
            }

            if (world.pov.transition === 0) {
                world.pov.weapon.position.x = frame.x;
                world.pov.weapon.position.y = frame.y;
                world.pov.weapon.position.z = frame.z;
            } else {
                const pos = world.pov.weapon.position;
                pos.x = ease(pos.x, frame.x, 1 - world.pov.transition);
                pos.y = ease(pos.y, frame.y, 1 - world.pov.transition);
                pos.z = ease(pos.z, frame.z, 1 - world.pov.transition);
            }
        }
    }

    private getState(world: World, entity: Entity) {
        const shooter = entity.getComponent(Comp.Shooter);
        if (shooter.shootTime === world.elapsedTime) {
            return PovState.Shoot;
        }

        const velocity = entity.getComponent(Comp.Velocity2D);
        if (velocity.lengthSq() > 0) {
            return PovState.Walk;
        }

        return PovState.Idle;
    }

    private getFrame(pov: Pov, elapsed: number) {
        const frame = new Vector3();
        frame.x = 0.75;
        frame.y = -0.625;
        frame.z = -1;

        switch (pov.state) {
            case PovState.Walk:
                elapsed *= 10;
                frame.y += Math.abs(Math.sin(elapsed) * 0.05);
                frame.x += Math.cos(elapsed) * 0.05;
                return frame;

            case PovState.Jump:
            case PovState.Fall:
                frame.y += 0.125;
                return frame;

            case PovState.Shoot:
                frame.copy(pov.weapon.position);
                frame.z = -0.825;
                return frame;

            case PovState.Idle:
            default:
                frame.y += Math.sin(elapsed) * 0.05;
                return frame;
        }
    }
}
