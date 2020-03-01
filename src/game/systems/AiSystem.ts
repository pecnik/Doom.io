import { System, Family, FamilyBuilder } from "@nova-engine/ecs";
import { World } from "../World";
import {
    PositionComponent,
    AiComponent,
    VelocityComponent,
    RotationComponent,
    LocalPlayerTag,
    ShooterComponent
} from "../Components";
import { Vector2 } from "three";

export class AiSystem extends System {
    private readonly bots: Family;
    private readonly players: Family;

    public constructor(world: World) {
        super();

        this.bots = new FamilyBuilder(world)
            .include(AiComponent)
            .include(PositionComponent)
            .include(VelocityComponent)
            .include(RotationComponent)
            .include(ShooterComponent)
            .build();

        this.players = new FamilyBuilder(world).include(LocalPlayerTag).build();
    }

    public update(world: World) {
        const [player] = this.players.entities;
        if (player === undefined) return;

        const playerPosition = player.getComponent(PositionComponent);
        for (let i = 0; i < this.bots.entities.length; i++) {
            const bot = this.bots.entities[i];
            const shooter = bot.getComponent(ShooterComponent);
            const position = bot.getComponent(PositionComponent);

            shooter.camera.copy(world.camera);
            shooter.camera.position.set(position.x, position.y, position.z);
            shooter.camera.rotation.set(0, 0, 0, "YXZ");

            shooter.camera.rotation.y = Math.atan2(
                playerPosition.x - position.x,
                playerPosition.z - position.z
            );

            shooter.raycaster.setFromCamera(shooter.origin, shooter.camera);

            const [ray] = shooter.raycaster.intersectObject(
                world.level.scene,
                true
            );

            if (ray === undefined) {
                continue;
            }

            const playerDist = position.distanceToSquared(playerPosition);
            const hitDist = position.distanceToSquared(ray.point);

            if (hitDist - playerDist > -1) {
                const rotation = bot.getComponent(RotationComponent);
                rotation.y = shooter.camera.rotation.y;

                const velocity = bot.getComponent(VelocityComponent);
                const movement = new Vector2(0, 2);
                movement.rotateAround(new Vector2(), -rotation.y);
                movement.multiplyScalar(1);
                velocity.x = movement.x;
                velocity.z = movement.y;
            }
        }
    }
}
