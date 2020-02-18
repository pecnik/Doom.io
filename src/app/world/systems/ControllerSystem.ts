import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { World } from "../World";
import { VelocityComponent, RotationComponent } from "../Components";
import { Input } from "../../core/Input";

export class ControllerSystem extends System {
    private readonly players: Family;
    private readonly input: Input;

    public constructor(world: World, input: Input) {
        super();
        this.input = input;
        this.players = new FamilyBuilder(world)
            .include(VelocityComponent)
            .include(RotationComponent)
            .build();
    }

    public update() {}
}
