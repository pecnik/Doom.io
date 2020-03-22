import { System, FamilyBuilder, Family } from "@nova-engine/ecs";
import { World } from "../data/World";
import { Hud } from "../data/Hud";
import { Comp } from "../data/Comp";
import {
    TextureLoader,
    AdditiveBlending,
    NearestFilter,
    Texture,
    MeshBasicMaterial,
    PlaneGeometry,
    Mesh
} from "three";
import { HUD_WIDTH, HUD_HEIGHT } from "../data/Globals";

export class HudElement<T> {
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
    private readonly family: Family;

    private readonly ammoText = new HudElement({
        width: 256,
        height: 128,
        props: { loadedAmmo: 0 }
    });

    public constructor(world: World, hud: Hud) {
        super();

        this.family = new FamilyBuilder(world)
            .include(Comp.PlayerInput)
            .include(Comp.Shooter)
            .build();

        // Ammo text
        hud.scene.add(this.ammoText.plane);

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

        // Load crosshair srpite
        new TextureLoader().load("/assets/sprites/crosshair.png", map => {
            const material = new MeshBasicMaterial({
                map,
                blending: AdditiveBlending
            });

            map.magFilter = NearestFilter;
            map.minFilter = NearestFilter;

            const geometry = new PlaneGeometry(64, 64);
            const crosshair = new Mesh(geometry, material);
            hud.scene.add(crosshair);
        });
    }

    public update() {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const shooter = entity.getComponent(Comp.Shooter);

            if (this.ammoText.props.loadedAmmo !== shooter.loadedAmmo) {
                this.ammoText.props.loadedAmmo = shooter.loadedAmmo;
                const { ctx, width, height, props, texture } = this.ammoText;
                texture.needsUpdate = true;
                ctx.clearRect(0, 0, width, height);
                ctx.fillText(
                    props.loadedAmmo.toString(),
                    width / 2,
                    height / 2
                );
            }
        }
    }
}