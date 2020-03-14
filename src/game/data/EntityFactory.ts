import { Entity } from "@nova-engine/ecs";
import { uniqueId } from "lodash";
import {
    LocalPlayerTag,
    PovComponent,
    HealthComponent,
    InputComponent,
    Object3DComponent,
    PositionComponent,
    VelocityComponent,
    RotationComponent,
    FootstepComponent,
    ShooterComponent,
    SoundComponent,
    JumpComponent
} from "./Components";

export module EntityFactory {
    export function Player(id = uniqueId("e-")) {
        const player = new Entity();
        player.id = id;
        player.putComponent(LocalPlayerTag);
        player.putComponent(PovComponent);
        player.putComponent(HealthComponent);
        player.putComponent(InputComponent);
        player.putComponent(Object3DComponent);
        player.putComponent(PositionComponent);
        player.putComponent(VelocityComponent);
        player.putComponent(RotationComponent);
        player.putComponent(FootstepComponent);
        player.putComponent(ShooterComponent);
        player.putComponent(SoundComponent);
        player.putComponent(JumpComponent);
        return player;
    }
}
