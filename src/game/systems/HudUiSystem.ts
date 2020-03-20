import { System } from "@nova-engine/ecs";
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

export class HudText {
    public readonly root = new Object3D();

    public constructor() {
        var hudCanvas = document.createElement("canvas");
        hudCanvas.width = 256;
        hudCanvas.height = 256;

        // Get 2D context and draw something supercool.
        var hudBitmap = hudCanvas.getContext("2d") as CanvasRenderingContext2D;
        hudBitmap.font = "Normal 40px Arial";
        hudBitmap.textAlign = "center";
        hudBitmap.fillStyle = "rgba(245,245,245,0.75)";
        hudBitmap.fillText(
            "Initializing...",
            hudCanvas.width / 2,
            hudCanvas.height / 2
        );

        // Create texture from rendered graphics.
        var hudTexture = new Texture(hudCanvas);
        hudTexture.needsUpdate = true;

        // Create HUD material.
        var material = new MeshBasicMaterial({
            map: hudTexture
        });
        material.transparent = true;
        hudTexture.minFilter = NearestFilter;
        hudTexture.magFilter = NearestFilter;

        // Create plane to render the HUD. This plane fill the whole screen.
        var planeGeometry = new PlaneGeometry(1, 1);
        var plane = new Mesh(planeGeometry, material);

        this.root = plane;
    }
}

export class HudUiSystem extends System {
    public constructor(_: World, hud: Hud) {
        super();

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

        const text = new HudText();
        text.root.position.x = -HUD_WIDTH / 2;
        hud.scene.add(text.root);
    }

    public update() {
        // ...
    }
}
