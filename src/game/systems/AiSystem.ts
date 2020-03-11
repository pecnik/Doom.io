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
import { Grid, AStarFinder } from "pathfinding";
import { Vector2 } from "three";

export class AiSystem extends System {
    private readonly players: Family;
    private readonly bots: Family;

    public constructor(world: World) {
        super();

        this.players = new FamilyBuilder(world)
            .include(LocalPlayerTag)
            .include(PositionComponent)
            .build();

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

        const position = player.getComponent(PositionComponent);

        const target = new Vector2(position.x, position.z);
        target.x = Math.round(target.x);
        target.y = Math.round(target.y);

        for (let i = 0; i < this.bots.entities.length; i++) {
            const bot = this.bots.entities[i];
            const ai = bot.getComponent(AiComponent);
            const position = bot.getComponent(PositionComponent);

            const point = new Vector2(position.x, position.z);

            // Find new path to player
            if (ai.target.equals(target) === false) {
                const grid = new Grid(
                    (() => {
                        const grid: number[][] = [];
                        world.level.cells.forEach(cell => {
                            const { x, z, wall } = cell;
                            const row = (grid[z] = grid[z] || []);
                            row[x] = wall ? 1 : 0;
                        });
                        return grid;
                    })()
                );

                ai.target.copy(target);
                ai.step = 0;
                ai.path = new AStarFinder()
                    .findPath(
                        Math.round(point.x),
                        Math.round(point.y),
                        Math.round(target.x),
                        Math.round(target.y),
                        grid
                    )
                    .map(section => new Vector2(section[0], section[1]));
            }

            const step = ai.path[ai.step];
            if (step === undefined) {
                continue;
            }

            point.lerp(target, 0.01);
            if (point.distanceToSquared(target) < 0.1) {
                ai.step++;
            }

            position.x = point.x;
            position.z = point.y;
        }
    }
}
