import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { World } from "../data/World";
import { Comp } from "../data/Comp";

export class PlayerShootSystem extends System {
    private readonly family: Family;

    public constructor(world: World) {
        super();
        this.family = new FamilyBuilder(world)
            .include(Comp.PlayerInput)
            .include(Comp.Position2D)
            .include(Comp.Rotation2D)
            .include(Comp.Shooter)
            .build();
    }

    public update(world: World) {
        const { elapsedTime } = world;
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const input = entity.getComponent(Comp.PlayerInput);
            // const position = entity.getComponent(Comp.Position2D);
            // const rotation = entity.getComponent(Comp.Rotation2D);
            const shooter = entity.getComponent(Comp.Shooter);

            const fireRate = 1 / 4;
            const shootDelta = elapsedTime - shooter.shootTime;
            if (input.shoot && shootDelta > fireRate) {
                shooter.shootTime = elapsedTime;

                console.log("> TODO: Play shoot sound");

                console.log("> TODO: Hitscan level");

                console.log("> TODO: Hitscan entity");
            }
        }
    }
}
