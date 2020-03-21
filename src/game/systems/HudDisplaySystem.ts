import { System, FamilyBuilder, Family } from "@nova-engine/ecs";
import { World } from "../data/World";
import { Hud } from "../data/Hud";
import { Comp } from "../data/Comp";
import {
    TextureLoader,
    SpriteMaterial,
    Sprite,
    AdditiveBlending,
    NearestFilter,
    Texture,
    MeshBasicMaterial,
    PlaneGeometry,
    Mesh,
    Plane
} from "three";
import { HUD_WIDTH, HUD_HEIGHT } from "../data/Globals";

export interface TextParams<T> {
    readonly width: number;
    readonly height: number;
    readonly props: T;
    readonly render: (ctx: CanvasRenderingContext2D) => void;
}

export class HudDisplaySystem extends System {
    private readonly family: Family;
    private readonly ammoText = this.createText({
        width: 256,
        height: 128,
        props: { loadedAmmo: 0 },
        render: ctx => {
            const { width, height } = this.ammoText;
            const { loadedAmmo } = this.ammoText.props;

            ctx.clearRect(0, 0, width, height);

            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = "white";
            ctx.fillText(loadedAmmo.toString(), width / 2, height / 2);
        }
    });

    private createText<T>(config: TextParams<T>) {
        const { width, height, props, render } = config;

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const texture = new Texture(canvas);
        texture.minFilter = NearestFilter;
        texture.magFilter = NearestFilter;
        texture.needsUpdate = true;

        const material = new MeshBasicMaterial({ map: texture });
        const geometry = new PlaneGeometry(width, height);
        const plane = new Mesh(geometry, material);

        // First render
        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        ctx.font = "Normal 40px Arial";
        ctx.textAlign = "center";

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "white";
        ctx.fillText("Initializing...", width / 2, height / 2);

        material.transparent = true;

        return {
            width,
            height,
            plane,
            props,
            render: () => {
                render(ctx);
                texture.needsUpdate = true;
            }
        };
    }

    public constructor(world: World, hud: Hud) {
        super();

        this.family = new FamilyBuilder(world)
            .include(Comp.PlayerInput)
            .include(Comp.Shooter)
            .build();

        this.ammoText.plane.position.set(
            HUD_WIDTH / 2 - this.ammoText.width / 2,
            -(HUD_HEIGHT / 2 - this.ammoText.height / 2),
            0
        );
        hud.scene.add(this.ammoText.plane);

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
                this.ammoText.render();
            }
        }
    }
}
