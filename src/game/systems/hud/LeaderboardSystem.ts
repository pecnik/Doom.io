import { System } from "../../ecs";
import { Scene } from "three";
import { HudElement } from "../../data/HudElement";
import { PlayerArchetype } from "../../ecs/Archetypes";
import { WEAPON_SPEC_RECORD } from "../../data/Weapon";
import { getImage } from "../../Helpers";
import { GameClient } from "../../GameClient";

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

    public constructor(game: GameClient, layer: Scene) {
        super(game);

        this.leaderboard.moveLeft();
        this.leaderboard.moveTop();
        layer.add(this.leaderboard.sprite);

        this.killfeed.moveRight();
        this.killfeed.moveTop();
        layer.add(this.killfeed.sprite);

        this.updateLeaderboard();
    }

    public updateInterval = 1 / 30;
    public update() {
        this.updateLeaderboard();
        this.updateKillFeed();
    }

    private updateLeaderboard() {
        const el = this.leaderboard;

        el.texture.needsUpdate = true;
        el.ctx.font = `Bold 16px 'Share Tech Mono'`;
        el.ctx.textBaseline = "top";
        el.ctx.textAlign = "left";
        el.ctx.clearRect(0, 0, el.width, el.height);

        const fillText = (text: string, x: number, y: number) => {
            el.ctx.fillStyle = "black";
            el.ctx.fillText(text, x + 2, y + 2);

            el.ctx.fillStyle = "white";
            el.ctx.fillText(text, x, y);
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
        const el = this.killfeed;

        el.texture.needsUpdate = true;
        el.ctx.font = `Bold 14px 'Share Tech Mono'`;
        el.ctx.textBaseline = "top";
        el.ctx.textAlign = "left";
        el.ctx.clearRect(0, 0, el.width, el.height);

        const fillText = (text: string, x: number, y: number, c = "white") => {
            el.ctx.fillStyle = "black";
            el.ctx.fillText(text, x + 2, y + 2);

            el.ctx.fillStyle = c;
            el.ctx.fillText(text, x, y);
        };

        let x = 8;
        let y = 8;
        this.world.killfeed.forEach((log) => {
            const max = 10;
            const delta = this.world.elapsedTime - log.time;
            if (delta < max) {
                const spec = WEAPON_SPEC_RECORD[log.weaponType];
                const icon = getImage(spec.icon);
                if (icon.width > 0) {
                    el.ctx.drawImage(icon, x, y, 16, 16);
                }

                fillText(log.killer, x + 24, y);
                fillText(log.victim, x + 128, y);
                y += 24;
            }
        });
    }
}
