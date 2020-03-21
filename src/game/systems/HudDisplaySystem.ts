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
    public readonly root = new Object3D();
    public readonly texture: Texture;
    public readonly canvas: HTMLCanvasElement;
    public readonly ctx: CanvasRenderingContext2D;

    public value = 0;

    public constructor() {
        this.canvas = document.createElement("canvas");
        this.canvas.width = 256;
        this.canvas.height = 256;

        // Get 2D context and draw something supercool.
        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
        this.ctx.font = "Normal 40px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillStyle = "rgba(245,245,245,0.75)";
        this.ctx.fillText(
            "Initializing...",
            this.canvas.width / 2,
            this.canvas.height / 2
        );

        // Create texture from rendered graphics.
        this.texture = new Texture(this.canvas);
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

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillText(
            this.value.toString(),
            this.canvas.width / 2,
            this.canvas.height / 2
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

        this.loadedAmmo = new HudText();
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
