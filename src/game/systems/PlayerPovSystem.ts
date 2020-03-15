import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { World } from "../data/World";
import { Comp } from "../data/Comp";

export class PlayerPovSystem extends System {
    public readonly family: Family;

    public constructor(world: World) {
        super();

        this.family = new FamilyBuilder(world)
            .include(Comp.PlayerInput)
            .build();
    }

    public update(world: World) {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const position = entity.getComponent(Comp.Position2D);
            const shooter = entity.getComponent(Comp.Shooter);

            // Animations
            if (shooter.shootTime === world.elapsedTime) {
                world.pov.shoot();
            }

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
        }
    }
}
