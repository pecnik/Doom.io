import { System } from "../../ecs";
import { World } from "../../ecs";
import { Hud } from "../../data/Hud";
import {
    NearestFilter,
    Texture,
    MeshBasicMaterial,
    PlaneGeometry,
    Mesh,
} from "three";
import { HUD_WIDTH, HUD_HEIGHT } from "../../data/Globals";
import { LocalAvatarArchetype } from "../../ecs/Archetypes";

class HudElement<T> {
    public readonly props: T;
    public readonly plane: Mesh;
    public readonly width: number;
    public readonly height: number;

    public readonly texture: Texture;
    public readonly canvas: HTMLCanvasElement;
    public readonly ctx: CanvasRenderingContext2D;

    public constructor(config: { props: T; width: number; height: number }) {
        const { props, width, height } = config;
        this.props = props;
        this.width = width;
        this.height = height;

        this.canvas = document.createElement("canvas");
        this.canvas.width = width;
        this.canvas.height = height;

        this.texture = new Texture(this.canvas);
        this.texture.minFilter = NearestFilter;
        this.texture.magFilter = NearestFilter;
        this.texture.needsUpdate = true;

        const material = new MeshBasicMaterial({ map: this.texture });
        const geometry = new PlaneGeometry(width, height);
        material.transparent = true;
        this.plane = new Mesh(geometry, material);

        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    }
}

export class HudDisplaySystem extends System {
    private readonly family = this.createEntityFamily({
        archetype: new LocalAvatarArchetype(),
    });

    private readonly ammoText = new HudElement({
        width: 256,
        height: 128,
        props: { loadedAmmo: 0, reservedAmmo: 0 },
    });

    private readonly dashMeter: Mesh;

    public constructor(world: World, hud: Hud) {
        super(world);

        // Ammo text
        {
            this.ammoText.ctx.font = "Normal 40px Arial";
            this.ammoText.ctx.textAlign = "center";
            this.ammoText.ctx.textBaseline = "middle";
            this.ammoText.ctx.fillStyle = "white";
            this.ammoText.plane.renderOrder = 100;
            this.ammoText.plane.position.set(
                HUD_WIDTH / 2 - this.ammoText.width / 2,
                -(HUD_HEIGHT / 2 - this.ammoText.height / 2),
                0
            );
            hud.scene.add(this.ammoText.plane);
        }

        // Dash meter
        {
            const geo = new PlaneGeometry(64, 8);
            geo.translate(32, 0, 0);

            const mat = new MeshBasicMaterial({
                color: 0xff00ff,
                transparent: true,
            });
            this.dashMeter = new Mesh(geo, mat);
            this.dashMeter.renderOrder = 100;
            this.dashMeter.position.x = -HUD_WIDTH / 2;
            this.dashMeter.position.y = -(
                HUD_HEIGHT / 2 -
                this.ammoText.height / 2
            );
            hud.scene.add(this.dashMeter);
        }
    }

    public update() {
        this.family.entities.forEach((entity) => {
            // Update dash meter
            this.dashMeter.scale.x = entity.jump.dashCharge;

            // Update ammo
            const { shooter } = entity;
            const ammo = shooter.ammo[shooter.weaponType];
            if (
                this.ammoText.props.loadedAmmo !== ammo.loaded ||
                this.ammoText.props.reservedAmmo !== ammo.reserved
            ) {
                this.ammoText.props.loadedAmmo = ammo.loaded;
                this.ammoText.props.reservedAmmo = ammo.reserved;

                const { ctx, width, height, props, texture } = this.ammoText;
                texture.needsUpdate = true;
                ctx.clearRect(0, 0, width, height);
                ctx.fillText(
                    [props.loadedAmmo, props.reservedAmmo].join("/"),
                    width / 2,
                    height / 2
                );
            }
        });
    }
}
