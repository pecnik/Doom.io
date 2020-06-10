import { System, Components } from "../../ecs";
import { World } from "../../ecs";
import { Scene } from "three";
import { LocalAvatarArchetype } from "../../ecs/Archetypes";
import { HudElement } from "../../data/HudElement";
import { WEAPON_SPEC_RECORD, WeaponType } from "../../data/Weapon";
import { memoize } from "lodash";

export class AmmoCountSystem extends System {
    private readonly weaponSpecs = Object.values(WEAPON_SPEC_RECORD);
    private readonly el = new HudElement({
        width: 128,
        height: 128,
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
        img.onload = () => {
            this.render();
        };
        return img;
    });

    public constructor(world: World, layer: Scene) {
        super(world);
        this.el.moveRight();
        this.el.moveBottom();
        layer.add(this.el.sprite);
        // layer.add(this.el.boxHelper());
        this.render();
    }

    public updateInterval = 1 / 30;
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
            const x = 64;
            const y = 16 + 24 * index;

            const active = this.el.props.active === weaponSpec.type;
            const ammo = this.el.props.shooter.ammo[weaponSpec.type];
            this.el.ctx.globalAlpha = active ? 1 : 0.5;

            const icon = this.getImage(weaponSpec.icon);
            if (icon.width > 0) {
                active
                    ? this.el.ctx.drawImage(icon, x - 32, y, 18, 18)
                    : this.el.ctx.drawImage(icon, x - 32, y, 16, 16);
            }

            this.el.ctx.font = `Bold 20px 'Share Tech Mono'`;
            this.el.ctx.textBaseline = "top";

            this.el.ctx.textAlign = "right";
            fillText(ammo.loaded.toString() + "|", x + 32, y);

            this.el.ctx.textAlign = "left";
            fillText(ammo.reserved.toString(), x + 32, y);

            // if (active) {
            //     const PADD = 8;
            //     const TILE = 40;
            //     const SIZE = TILE - PADD * 2;

            //     const x = 0;
            //     const y = this.el.height - TILE;

            //     const icon = this.getImage(weaponSpec.icon);
            //     if (icon.width > 0) {
            //         this.el.ctx.drawImage(icon, x + PADD, y + PADD, SIZE, SIZE);
            //     }

            //     this.el.ctx.font = `Bold ${SIZE}px 'Share Tech Mono'`;
            //     this.el.ctx.textAlign = "left";
            //     this.el.ctx.textBaseline = "top";
            //     fillText(ammo.loaded.toString(), x + TILE + PADD, y + PADD);
            // }
        });
    }
}
