import { System, Components } from "../../ecs";
import { World } from "../../ecs";
import { Scene } from "three";
import { LocalAvatarArchetype } from "../../ecs/Archetypes";
import { HudElement } from "../../data/HudElement";
import { WEAPON_SPEC_RECORD, WeaponType } from "../../data/Weapon";
import { HUD_WIDTH, HUD_HEIGHT } from "../../data/Globals";
import { memoize } from "lodash";

export class AmmoCountSystem extends System {
    private readonly weaponSpecs = Object.values(WEAPON_SPEC_RECORD);
    private readonly el = new HudElement({
        width: 256,
        height: 256,
        props: {
            active: WeaponType.Pistol,
            shooter: new Components.Shooter(),
        },
    });

    private readonly family = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    private readonly getImage = memoize((src: string) => {
        const img = new Image();
        img.src = src;
        img.onload = () => console.log(`> loaded: ${src}`);
        return img;
    });

    public constructor(world: World, layer: Scene) {
        super(world);
        this.el.plane.position.x = HUD_WIDTH / 2;
        this.el.plane.position.y = -HUD_HEIGHT / 2;
        this.el.plane.geometry.translate(
            -this.el.width / 2,
            this.el.height / 2,
            0
        );
        layer.add(this.el.plane);

        this.render();
    }

    public update() {
        const avatar = this.family.first();
        if (avatar === undefined) {
            return;
        }

        let cahnge = false;

        if (this.el.props.active !== avatar.shooter.weaponType) {
            this.el.props.active = avatar.shooter.weaponType;
            cahnge = true;
        }

        this.weaponSpecs.forEach((weaponSpec) => {
            const ammo = avatar.shooter.ammo[weaponSpec.type];
            const prop = this.el.props.shooter.ammo[weaponSpec.type];

            if (prop.loaded !== ammo.loaded) {
                prop.loaded = ammo.loaded;
                cahnge = true;
            }

            if (prop.reserved !== ammo.reserved) {
                prop.reserved = ammo.reserved;
                cahnge = true;
            }
        });

        if (cahnge) {
            this.render();
        }
    }

    private render() {
        this.el.texture.needsUpdate = true;
        this.el.ctx.clearRect(0, 0, this.el.width, this.el.height);

        const fillText = (text: string, x: number, y: number) => {
            this.el.ctx.fillStyle = "black";
            this.el.ctx.fillText(text, x + 2, y + 2);
            this.el.ctx.fillStyle = "white";
            this.el.ctx.fillText(text, x, y);
        };

        this.weaponSpecs.forEach((weaponSpec, index) => {
            const active = this.el.props.active === weaponSpec.type;
            const ammo = this.el.props.shooter.ammo[weaponSpec.type];
            const x = this.el.width - 48;
            const y = 16 + 28 * index;

            this.el.ctx.globalAlpha = active ? 1 : 0.5;

            const icon = this.getImage(weaponSpec.icon);
            if (icon.width > 0) {
                this.el.ctx.drawImage(icon, x - 48, y - 12, 24, 24);
            }

            this.el.ctx.font = "Bold 12px 'Share Tech Mono'";

            this.el.ctx.textAlign = "right";
            fillText(ammo.loaded.toString() + "|", x, y);

            this.el.ctx.textAlign = "left";
            fillText(ammo.reserved.toString(), x, y);

            if (active) {
                const x = this.el.width - 128;
                const y = this.el.height - 48;

                const icon = this.getImage(weaponSpec.icon);
                if (icon.width > 0) {
                    this.el.ctx.drawImage(icon, x, y - 24, 48, 48);
                }

                this.el.ctx.textAlign = "left";
                this.el.ctx.font = "Bold 44px 'Share Tech Mono'";
                fillText(ammo.loaded.toString(), x + 64, y);
            }
        });
    }
}
