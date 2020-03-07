import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { World } from "../World";
import {
    PositionComponent,
    AiComponent,
    VelocityComponent,
    RotationComponent,
    LocalPlayerTag,
    ShooterComponent,
    ControllerComponent,
    AiState
} from "../Components";
import { modulo, ease } from "../core/Utils";

export class AiSystem extends System {
    private readonly players: Family;
    private readonly bots: Family;

    public constructor(world: World) {
        super();

        this.players = new FamilyBuilder(world).include(LocalPlayerTag).build();

        this.bots = new FamilyBuilder(world)
            .include(AiComponent)
            .include(ControllerComponent)
            .include(PositionComponent)
            .include(VelocityComponent)
            .include(RotationComponent)
            .include(ShooterComponent)
            .build();
    }

    public update(world: World) {
        const [player] = this.players.entities;
        if (player === undefined) return;

        for (let i = 0; i < this.bots.entities.length; i++) {
            const bot = this.bots.entities[i];
            const ai = bot.getComponent(AiComponent);

            switch (ai.state) {
                case AiState.Idle: {
                    const hit = this.findDestination(bot, world);
                    if (hit !== undefined) {
                        const position = bot.getComponent(PositionComponent);
                        ai.state = AiState.Turning;
                        ai.targetDestination.copy(hit.point);
                        ai.targetDirection = Math.atan2(
                            position.x - ai.targetDestination.x,
                            position.z - ai.targetDestination.z
                        );
                        ai.targetDirection = modulo(
                            ai.targetDirection,
                            Math.PI * 2
                        );
                    }
                    break;
                }

                case AiState.Turning: {
                    const rotation = bot.getComponent(RotationComponent);
                    rotation.y = ease(rotation.y, ai.targetDirection, 0.1);

                    const delta = rotation.y - ai.targetDirection;
                    if (Math.abs(delta) < 0.01) {
                        ai.state = AiState.Roaming;
                    }
                    break;
                }

                case AiState.Roaming: {
                    const controller = bot.getComponent(ControllerComponent);
                    controller.move.y = -1;
                    controller.walk = true;

                    const position = bot.getComponent(PositionComponent);
                    const delta = ai.targetDestination.distanceToSquared(
                        position
                    );

                    if (Math.abs(delta) < 1) {
                        ai.state = AiState.Idle;
                        controller.move.y = 0;
                    }

                    break;
                }
            }
        }
    }

    private findDestination(bot: Entity, world: World) {
        const position = bot.getComponent(PositionComponent);
        const shooter = bot.getComponent(ShooterComponent);

        const direction = Math.random() * Math.PI * 2;
        shooter.camera.position.copy(position);
        shooter.camera.rotation.set(0, direction, 0, "YXZ");
        shooter.camera.updateWorldMatrix(false, false);
        shooter.raycaster.setFromCamera(shooter.origin, shooter.camera);

        // console.log("New dir ", { direction });

        const hits = shooter.raycaster.intersectObject(world.level.scene, true);
        for (let i = 0; i < hits.length; i++) {
            return hits[i];
        }
        return;
    }
}
