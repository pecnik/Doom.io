import { System, Family, FamilyBuilder, Entity } from "@nova-engine/ecs";
import { World } from "../data/World";
import {
    PositionComponent,
    AiComponent,
    VelocityComponent,
    RotationComponent,
    LocalPlayerTag,
    ShooterComponent,
    InputComponent
} from "../data/Components";
import { Grid, AStarFinder } from "pathfinding";
import { Vector2 } from "three";
import { WALK_SPEED, RUN_SPEED } from "../data/Globals";
import { ease } from "../core/Utils";

const MIN_PLAYER_DIST = 5;
const MAX_PLAYER_DIST = 9;

export class BotAiSystem extends System {
    private readonly players: Family;
    private readonly bots: Family;
    private readonly wallGrid: Grid;
    private readonly pathfinder: AStarFinder;

    public constructor(world: World) {
        super();

        this.players = new FamilyBuilder(world)
            .include(LocalPlayerTag)
            .include(PositionComponent)
            .build();

        this.bots = new FamilyBuilder(world)
            .include(AiComponent)
            .include(InputComponent)
            .include(PositionComponent)
            .include(VelocityComponent)
            .include(RotationComponent)
            .include(ShooterComponent)
            .build();

        const walls: number[][] = [];
        world.level.cells.forEach(cell => {
            const { x, z, wall } = cell;
            const row = (walls[z] = walls[z] || []);
            row[x] = wall ? 1 : 0;
        });
        this.wallGrid = new Grid(walls);
        this.pathfinder = new AStarFinder(); // TODO - check options
    }

    public update(world: World) {
        const [player] = this.players.entities;
        if (player === undefined) return;

        const playerPos = player.getComponent(PositionComponent);
        for (let i = 0; i < this.bots.entities.length; i++) {
            const bot = this.bots.entities[i];

            const input = bot.getComponent(InputComponent);
            const position = bot.getComponent(PositionComponent);
            const velocity = bot.getComponent(VelocityComponent);
            const rotation = bot.getComponent(RotationComponent);

            // Reset velocity
            velocity.x = 0;
            velocity.z = 0;

            if (!this.isPlayerInsight(bot, world, playerPos)) {
                this.followPlayer(bot, playerPos);
                input.shoot = false;
            } else {
                let targetRot = Math.atan2(
                    position.z - playerPos.z,
                    position.x - playerPos.x
                );
                targetRot -= Math.PI / 2;
                targetRot *= -1;

                rotation.y = ease(rotation.y, targetRot, 0.1);
                input.shoot = true;
            }
        }
    }

    public isPlayerInsight(
        bot: Entity,
        world: World,
        playerPos: PositionComponent
    ) {
        const position = bot.getComponent(PositionComponent);
        const playerDist = position.distanceToSquared(playerPos);
        if (playerDist > MIN_PLAYER_DIST) {
            return false;
        }

        const shooter = bot.getComponent(ShooterComponent);
        shooter.camera.position.copy(position);
        shooter.camera.lookAt(playerPos);
        shooter.camera.updateWorldMatrix(false, false);

        // Level hitscan
        const level = world.level.scene;
        const [intersection] = shooter.raycaster.intersectObject(level, true);
        if (intersection === undefined) {
            return true;
        }

        const wallDist = intersection.point.distanceToSquared(position);
        return wallDist > playerDist;
    }

    public followPlayer(bot: Entity, playerPos: PositionComponent) {
        const ai = bot.getComponent(AiComponent);
        const position = bot.getComponent(PositionComponent);
        const velocity = bot.getComponent(VelocityComponent);
        const rotation = bot.getComponent(RotationComponent);

        // Update player path
        const dx = Math.abs(ai.target.x - playerPos.x);
        const dy = Math.abs(ai.target.y - playerPos.z);
        if (dx > 2 || dy > 2) {
            ai.target.x = Math.round(playerPos.x);
            ai.target.y = Math.round(playerPos.z);
            ai.step = 0;
            ai.path = this.pathfinder
                .findPath(
                    Math.round(position.x),
                    Math.round(position.z),
                    ai.target.x,
                    ai.target.y,
                    this.wallGrid.clone()
                )
                .map(p => {
                    return new Vector2(p[0], p[1]);
                });
        }

        // Folow path
        const target = ai.path[ai.step];
        if (target === undefined) {
            return;
        }

        // Test if reached next cell
        const origin = new Vector2(position.x, position.z);
        if (origin.distanceToSquared(target) < 0.1) {
            ai.step++;
            return;
        }

        const playerDist = position.distanceToSquared(playerPos);
        const speed = playerDist > MAX_PLAYER_DIST ? RUN_SPEED : WALK_SPEED;
        origin.sub(target);
        origin.normalize();
        origin.multiplyScalar(-speed);
        velocity.x = origin.x;
        velocity.z = origin.y;

        let targetRot = Math.atan2(
            position.z - target.y,
            position.x - target.x
        );
        targetRot -= Math.PI / 2;
        targetRot *= -1;

        rotation.y = ease(rotation.y, targetRot, 0.1);
    }
}
