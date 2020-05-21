import { System, Components } from "../../ecs";
import { World } from "../../ecs";
import { Scene } from "three";
import { LocalAvatarArchetype } from "../../ecs/Archetypes";
import { HudElement } from "../../data/HudElement";
import { clamp } from "lodash";

export class HealthBarSystem extends System {
    private readonly el = new HudElement({
        width: 256,
        height: 64,
        props: {
            health: new Components.Health(),
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
        layer.add(this.el.boxHelper());
        this.render();
    }

    public update() {
        const avatar = this.family.first();
        if (avatar === undefined) {
            return;
        }

        let cahnge = false;

        if (this.el.props.health.value !== avatar.health.value) {
            this.el.props.health.value = avatar.health.value;
            cahnge = true;
        }

        if (cahnge) {
            this.render();
        }
    }

    private render() {
        this.el.texture.needsUpdate = true;
        this.el.ctx.clearRect(0, 0, this.el.width, this.el.height);

        const w = 32;
        for (let i = 0; i < 5; i++) {
            const x = 8 + i * (w + 4);
            const y = 20;
            const h = 24;
            this.el.ctx.fillStyle = "black";
            this.el.ctx.fillRect(x + 2, y + 2, w, h);

            let value = this.el.props.health.value - i * 20;
            value = clamp(value, 0, 20);
            if (value > 0) {
                this.el.ctx.fillStyle = "white";
                this.el.ctx.fillRect(x, y, w * (value / 20), h);
            }
        }
    }
}
