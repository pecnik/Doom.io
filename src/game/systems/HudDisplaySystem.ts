import { System, FamilyBuilder, Family } from "@nova-engine/ecs";
import { World } from "../data/World";
import { Hud } from "../data/Hud";
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
    Object3D
} from "three";
import { HUD_WIDTH, HUD_HEIGHT } from "../data/Globals";
import { Comp } from "../data/Comp";

export class HudText {
    private readonly ctx: CanvasRenderingContext2D;
    private readonly texture: Texture;

    public readonly root = new Object3D();
    public readonly width: number;
    public readonly height: number;
    public value = 0;

    public constructor(width: number, height: number) {
        this.width = width;
        this.height = height;

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        // Get 2D context and draw something supercool.
        this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        this.ctx.font = "Normal 40px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillStyle = "rgba(245,245,245,0.75)";
        this.ctx.fillText("Initializing...", this.width / 2, this.height / 2);

        // Create texture from rendered graphics.
        this.texture = new Texture(canvas);
        this.texture.needsUpdate = true;

        // Create HUD material.
        var material = new MeshBasicMaterial({
            map: this.texture
        });
        material.transparent = true;
        this.texture.minFilter = NearestFilter;
        this.texture.magFilter = NearestFilter;

        const planeGeometry = new PlaneGeometry(1, 1);
        const plane = new Mesh(planeGeometry, material);
        this.root = plane;
    }

    public update() {
        console.log("Rerender");

        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.fillText(
            this.value.toString(),
            this.width / 2,
            this.height / 2
        );

        this.texture.needsUpdate = true;
    }
}

export class HudDisplaySystem extends System {
    private readonly family: Family;
    private readonly loadedAmmo: HudText;

    public constructor(world: World, hud: Hud) {
        super();

        this.family = new FamilyBuilder(world)
            .include(Comp.PlayerInput)
            .include(Comp.Shooter)
            .build();

        this.loadedAmmo = new HudText(256, 128);
        this.loadedAmmo.root.position.x = HUD_WIDTH / 3;
        this.loadedAmmo.root.position.y = -HUD_HEIGHT / 3;
        this.loadedAmmo.root.renderOrder = 100;
        hud.scene.add(this.loadedAmmo.root);

        new TextureLoader().load("/assets/sprites/crosshair.png", map => {
            const material = new SpriteMaterial({
                map,
                blending: AdditiveBlending
            });

            map.magFilter = NearestFilter;
            map.minFilter = NearestFilter;

            const crosshair = new Sprite(material);
            hud.scene.add(crosshair);
        });
    }

    public update() {
        for (let i = 0; i < this.family.entities.length; i++) {
            const entity = this.family.entities[i];
            const shooter = entity.getComponent(Comp.Shooter);

            if (this.loadedAmmo.value !== shooter.loadedAmmo) {
                this.loadedAmmo.value = shooter.loadedAmmo;
                this.loadedAmmo.update();
            }
        }
    }
}
