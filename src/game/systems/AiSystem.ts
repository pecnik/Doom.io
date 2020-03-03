import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { World } from "../World";
import { clamp, random } from "lodash";
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
            const postion = bot.getComponent(PositionComponent);
            const rotation = bot.getComponent(RotationComponent);
            const controller = bot.getComponent(ControllerComponent);

            const dist = postion.distanceToSquared(ai.destination);
            if (dist < 1) {
                ai.hasDestination = false;
            }

            if (ai.hasDestination === false) {
                ai.hasDestination = this.setDestination(bot, world);

                const angle = Math.atan2(
                    postion.x - ai.destination.x,
                    postion.z - ai.destination.z
                );

                controller.look.y = rotation.y - angle;
            }

            if (ai.hasDestination === true) {
                const angle = Math.atan2(
                    postion.x - ai.destination.x,
                    postion.z - ai.destination.z
                );

                controller.look.y = rotation.y - angle;

                controller.move.y = -1;
            }
        }
    }

    private setDestination(bot: Entity, world: World): boolean {
        const ai = bot.getComponent(AiComponent);
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
            const hit = hits[i];
            ai.destination.x = hit.point.x;
            ai.destination.z = hit.point.z;
            return true;
        }
        return false;
    }
}
