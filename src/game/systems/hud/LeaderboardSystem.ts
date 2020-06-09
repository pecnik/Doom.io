import { System } from "../../ecs";
import { World } from "../../ecs";
import { Scene } from "three";
import { HudElement } from "../../data/HudElement";
import { PlayerArchetype } from "../../ecs/Archetypes";

export class LeaderboardSystem extends System {
    private readonly players = this.createEntityFamily({
        archetype: new PlayerArchetype(),
    });

    private readonly el = new HudElement({
        width: 256,
        height: 256,
        props: {

        },
    });

    public constructor(world: World, layer: Scene) {
        super(world);
        this.el.moveLeft();
        this.el.moveTop();
        layer.add(this.el.sprite);
        layer.add(this.el.boxHelper());
        this.render();
    }

    public updateInterval = 1.0;
    public update() {
        this.render();
    }

    private render() {
        this.el.texture.needsUpdate = true;
        this.el.ctx.font = `Bold 16px 'Share Tech Mono'`;
        this.el.ctx.textBaseline = "top";
        this.el.ctx.textAlign = "left";
        this.el.ctx.clearRect(0, 0, this.el.width, this.el.height);

        const fillText = (text: string, x: number, y: number) => {
            this.el.ctx.fillStyle = "black";
            this.el.ctx.fillText(text, x + 2, y + 2);

            this.el.ctx.fillStyle = "white";
            this.el.ctx.fillText(text, x, y);
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
}
