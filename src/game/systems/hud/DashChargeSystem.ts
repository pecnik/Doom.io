import { System, Components } from "../../ecs";
import { World } from "../../ecs";
import { Scene } from "three";
import { LocalAvatarArchetype } from "../../ecs/Archetypes";
import { HudElement } from "../../data/HudElement";
import { HUD_WIDTH, HUD_HEIGHT, DASH_CHARGE } from "../../data/Globals";
import { clamp } from "lodash";

export class DashChargeSystem extends System {
    private readonly el = new HudElement({
        width: 256,
        height: 64,
        props: {
            jump: new Components.Jump(),
        },
    });

    private readonly family = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    public constructor(world: World, layer: Scene) {
        super(world);
        this.el.plane.position.x = -HUD_WIDTH / 2;
        this.el.plane.position.y = -HUD_HEIGHT / 2;
        this.el.plane.geometry.translate(128, 32, 0);
        layer.add(this.el.plane);
        this.render();
    }

    public update() {
        const avatar = this.family.first();
        if (avatar === undefined) {
            return;
        }

        let cahnge = false;

        if (this.el.props.jump.dashCharge !== avatar.jump.dashCharge) {
            this.el.props.jump.dashCharge = avatar.jump.dashCharge;
            cahnge = true;
        }

        if (cahnge) {
            this.render();
        }
    }

    private render() {
        this.el.texture.needsUpdate = true;
        this.el.ctx.clearRect(0, 0, this.el.width, this.el.height);

        const x = 32;
        const y = 32;
        const r = 12;

        const charge = this.el.props.jump.dashCharge;
        for (let i = 0; i < DASH_CHARGE; i++) {
            const val = clamp(charge - i, 0, 1);
            if (val === 0) continue;

            this.el.ctx.lineWidth = 8;
            this.el.ctx.strokeStyle = val === 1 ? "#f53b57" : "#747d8c";
            this.el.ctx.beginPath();
            this.el.ctx.arc(x + i * 64, y, r, 0, 2 * Math.PI);
            this.el.ctx.stroke();
            this.el.ctx.closePath();

            if (val < 1) {
                this.el.ctx.lineWidth = 4;
                this.el.ctx.strokeStyle = "#ffa502";
                this.el.ctx.beginPath();
                this.el.ctx.arc(x + i * 64, y, r, 0, 2 * Math.PI * val);
                this.el.ctx.stroke();
                this.el.ctx.closePath();
            }
        }
    }
}
