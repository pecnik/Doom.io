import { System } from "../../ecs";
import { World } from "../../ecs";
import { Scene } from "three";
import { HudElement } from "../../data/HudElement";
import { PlayerArchetype } from "../../ecs/Archetypes";

export class LeaderboardSystem extends System {
    private readonly players = this.createEntityFamily({
        archetype: new PlayerArchetype(),
    });

    private readonly leaderboard = new HudElement({
        width: 256,
        height: 256,
        props: {},
    });

    private readonly killfeed = new HudElement({
        width: 256,
        height: 256,
        props: {},
    });

    public constructor(world: World, layer: Scene) {
        super(world);

        this.leaderboard.moveLeft();
        this.leaderboard.moveTop();
        layer.add(this.leaderboard.sprite);

        this.killfeed.moveRight();
        this.killfeed.moveTop();
        layer.add(this.killfeed.sprite);
        layer.add(this.killfeed.boxHelper());

        this.updateLeaderboard();
    }

    public updateInterval = 1.0;
    public update() {
        this.updateLeaderboard();
        this.updateKillFeed();
    }

    private updateLeaderboard() {
        this.leaderboard.texture.needsUpdate = true;
        this.leaderboard.ctx.font = `Bold 16px 'Share Tech Mono'`;
        this.leaderboard.ctx.textBaseline = "top";
        this.leaderboard.ctx.textAlign = "left";
        this.leaderboard.ctx.clearRect(
            0,
            0,
            this.leaderboard.width,
            this.leaderboard.height
        );

        const fillText = (text: string, x: number, y: number) => {
            this.leaderboard.ctx.fillStyle = "black";
            this.leaderboard.ctx.fillText(text, x + 2, y + 2);

            this.leaderboard.ctx.fillStyle = "white";
            this.leaderboard.ctx.fillText(text, x, y);
        };

        let x = 8;
        let y = 8;
        this.players.entities.forEach((player) => {
            const { name, kills, deaths } = player.playerData;
            fillText(name, x, y);
            fillText(kills.toString(), x + 128, y);
            fillText(deaths.toString(), x + 172, y);
            y += 24;
        });
    }

    private updateKillFeed() {
        this.killfeed.texture.needsUpdate = true;
        this.killfeed.ctx.font = `Bold 14px 'Share Tech Mono'`;
        this.killfeed.ctx.textBaseline = "top";
        this.killfeed.ctx.textAlign = "left";
        this.killfeed.ctx.clearRect(
            0,
            0,
            this.killfeed.width,
            this.killfeed.height
        );

        const fillText = (text: string, x: number, y: number) => {
            this.killfeed.ctx.fillStyle = "black";
            this.killfeed.ctx.fillText(text, x + 2, y + 2);

            this.killfeed.ctx.fillStyle = "white";
            this.killfeed.ctx.fillText(text, x, y);
        };

        let x = 8;
        let y = 8;
        this.world.killfeed.forEach((log) => {
            fillText(log.killer, x, y);
            fillText(log.victim, x + 128, y);
            y += 24;
        });
    }
}
