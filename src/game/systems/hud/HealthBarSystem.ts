import { System } from "../../ecs";
import { World } from "../../ecs";
import { Scene } from "three";
import { LocalAvatarArchetype } from "../../ecs/Archetypes";
import { HudElement } from "../../data/HudElement";
import { clamp } from "lodash";
import { lerp } from "../../core/Utils";

export class HealthBarSystem extends System {
    private readonly colors = [
        "#FF0000",
        "#EE8716",
        "#E7EE16",
        "#8ED930",
        "#11D329",
    ];
    private readonly el = new HudElement({
        width: 256,
        height: 64,
        props: {
            health: 0,
        },
    });

    private readonly family = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    public constructor(world: World, layer: Scene) {
        super(world);
        this.el.moveLeft(64);
        this.el.moveBottom();
        layer.add(this.el.sprite);
        // layer.add(this.el.boxHelper());
        this.render();
    }

    public update() {
        const health = this.getLocalAvatarHealth();
        if (this.el.props.health !== health) {
            this.el.props.health = lerp(this.el.props.health, health, 5);
            this.render();
        }
    }

    private getLocalAvatarHealth() {
        const avatar = this.family.first();
        if (avatar === undefined) return 0;
        return avatar.health.value;
    }

    private render() {
        this.el.texture.needsUpdate = true;
        this.el.ctx.clearRect(0, 0, this.el.width, this.el.height);

        let cindex = Math.floor((this.el.props.health - 10) / 20);
        cindex = clamp(cindex, 0, 4);
        const color = this.colors[cindex];

        const w = 32;
        for (let i = 0; i < 5; i++) {
            const x = 8 + i * (w + 4);
            const y = 20;
            const h = 24;
            this.el.ctx.fillStyle = "black";
            this.el.ctx.fillRect(x + 2, y + 2, w, h);

            let value = this.el.props.health - i * 20;
            value = clamp(value, 0, 20);
            if (value > 0) {
                this.el.ctx.fillStyle = color;
                this.el.ctx.fillRect(x, y, w * (value / 20), h);
            }
        }
    }
}
