import { System, Components } from "../../ecs";
import { World } from "../../ecs";
import { Scene } from "three";
import { LocalAvatarArchetype } from "../../ecs/Archetypes";
import { HudElement } from "../../data/HudElement";
import { WEAPON_SPEC_RECORD, WeaponType } from "../../data/Weapon";
import { HUD_WIDTH, HUD_HEIGHT } from "../../data/Globals";

export class AmmoCountSystem extends System {
    private readonly weaponSpecs = Object.values(WEAPON_SPEC_RECORD);
    private readonly el = new HudElement({
        width: 256,
        height: 128,
        props: {
            active: WeaponType.Pistol,
            shooter: new Components.Shooter(),
        },
    });

    private readonly family = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    public constructor(world: World, layer: Scene) {
        super(world);
        this.el.plane.position.x = HUD_WIDTH / 2;
        this.el.plane.position.y = -HUD_HEIGHT / 2;
        this.el.plane.geometry.translate(-128, 64, 0);
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

        this.weaponSpecs.forEach((weaponSpec, index) => {
            const active = this.el.props.active === weaponSpec.type;
            const ammo = this.el.props.shooter.ammo[weaponSpec.type];
            const x = this.el.width - 64;
            const y = 16 + 24 * index;

            this.el.ctx.font = "Bold 16px Arial";
            this.el.ctx.globalAlpha = active ? 1 : 0.25;
            this.el.ctx.fillStyle = "white"

            this.el.ctx.textAlign = "right";
            this.el.ctx.fillText(weaponSpec.name + ":", x - 32, y);

            this.el.ctx.fillText(ammo.loaded.toString(), x, y);

            this.el.ctx.textAlign = "left";
            this.el.ctx.fillText(ammo.reserved.toString(), x + 8, y);

            if (active) {
                const x = this.el.width / 2;
                const y = this.el.height - 32;
                this.el.ctx.font = "Bold 24px Arial";

                const text = `${weaponSpec.name}: ${ammo.loaded} / ${ammo.reserved}`;
                this.el.ctx.textAlign = "center";
                this.el.ctx.fillText(text, x, y);
            }
        });
    }
}
