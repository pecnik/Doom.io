import { System, Components } from "../../ecs";
import { World } from "../../ecs";
import { Scene } from "three";
import { LocalAvatarArchetype } from "../../ecs/Archetypes";
import { HudElement } from "../../data/HudElement";
import { clamp } from "lodash";

export class HealthBarSystem extends System {
    private readonly el = new HudElement({
        width: 128,
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
        this.el.moveLeft();
        this.el.moveBottom();
        layer.add(this.el.sprite);
        // layer.add(this.el.boxHelper());
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
        const r = 16;

        const stroke = (x: number, y: number, s: number, e: number) => {
            this.el.ctx.strokeStyle = "black";
            this.el.ctx.beginPath();
            this.el.ctx.arc(x + 2, y + 2, r, s, e);
            this.el.ctx.stroke();
            this.el.ctx.closePath();

            this.el.ctx.strokeStyle = "white";
            this.el.ctx.beginPath();
            this.el.ctx.arc(x, y, r, s, e);
            this.el.ctx.stroke();
            this.el.ctx.closePath();
        };

        this.el.ctx.lineWidth = 6;

        const s1 = Math.PI * 0.5;
        const c1 = clamp(this.el.props.jump.dashCharge, 0, 1);
        stroke(x, y, s1, s1 + Math.PI * c1);

        const s2 = s1 + Math.PI;
        const c2 = clamp(this.el.props.jump.dashCharge - 1, 0, 1);
        stroke(x + 2, y, s2, s2 + Math.PI * c2);
    }
}
