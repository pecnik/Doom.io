import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { World } from "../World";
import {
    PositionComponent,
    AiComponent,
    VelocityComponent,
    RotationComponent,
    LocalPlayerTag,
    ShooterComponent,
    ControllerComponent
} from "../Components";

export class AiSystem extends System {
    private readonly bots: Family;
    private readonly players: Family;

    public constructor(world: World) {
        super();

        this.bots = new FamilyBuilder(world)
            .include(AiComponent)
            .include(ControllerComponent)
            .include(PositionComponent)
            .include(VelocityComponent)
            .include(RotationComponent)
            .include(ShooterComponent)
            .build();

        this.players = new FamilyBuilder(world).include(LocalPlayerTag).build();
    }

    public update() {
        const [player] = this.players.entities;
        if (player === undefined) return;

        for (let i = 0; i < this.bots.entities.length; i++) {
            const bot = this.bots.entities[i];
            const controller = bot.getComponent(ControllerComponent);

            controller.look.y = Math.random() * 0.05;
            controller.move.y = 1;

            controller.shoot = Math.random() < 0.1;
        }
    }
}
