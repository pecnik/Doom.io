import { Tool } from "./Tool";
import {
    Intersection,
    Mesh,
    MeshBasicMaterial,
    PlaneGeometry,
    Object3D,
    TextureLoader,
    Scene,
    AdditiveBlending
} from "three";
import { Hitscan } from "../../game/utils/EntityUtils";
import { HUD_WIDTH, HUD_HEIGHT } from "../../game/data/Globals";
import { TILE_COLS, TILE_ROWS } from "../data/Constants";
import { GameEditor } from "../GameEditor";

export class ActionSelectTool extends Tool {
    private readonly scene = new Scene();
    private readonly cursor = new Object3D();
    private readonly texturePlanel = new Object3D();

    public constructor(editor: GameEditor) {
        super(editor);

        this.cursor.renderOrder = 20;
        this.cursor.position.set(0, 0, 0);

        this.texturePlanel.renderOrder = 10;
        this.texturePlanel.position.set(0, 0, -1);

        this.scene.visible = false;
        this.scene.add(this.texturePlanel, this.cursor);
        this.hud.scene.add(this.scene);

        new TextureLoader().load("/assets/sprites/crosshair.png", map => {
            const geometry = new PlaneGeometry(48, 48);
            const material = new MeshBasicMaterial({
                map,
                depthTest: false,
                depthWrite: false,
                blending: AdditiveBlending
            });

            const sprite = new Mesh(geometry, material);
            sprite.renderOrder = this.cursor.renderOrder;
            this.cursor.add(sprite);
        });

        new TextureLoader().load("/assets/tileset.png", map => {
            const geometry = new PlaneGeometry(
                HUD_WIDTH * 0.25,
                HUD_WIDTH * 0.25
            );

            const material = new MeshBasicMaterial({
                map,
                depthTest: false,
                depthWrite: false
            });

            const sprite = new Mesh(geometry, material);
            sprite.renderOrder = this.texturePlanel.renderOrder;
            this.texturePlanel.add(sprite);
        });
    }

    public start() {
        this.scene.visible = true;
        this.cursor.position.set(0, 0, 0);
    }

    public end() {
        // Hitscan
        const cursor = this.cursor.position;
        const buffer: Intersection[] = [];
        Hitscan.origin.set(
            cursor.x / (HUD_WIDTH / 2),
            cursor.y / (HUD_HEIGHT / 2)
        );
        Hitscan.raycaster.setFromCamera(Hitscan.origin, this.hud.camera);
        Hitscan.raycaster.intersectObject(this.texturePlanel, true, buffer);

        for (let i = 0; i < buffer.length; i++) {
            const rsp = buffer[i];
            if (rsp.uv) {
                const x = Math.floor(rsp.uv.x * TILE_COLS);
                const y = Math.floor((1 - rsp.uv.y) * TILE_ROWS);
                const index = y * TILE_COLS + x;
                this.world.texutreIndex = index + 1;
            }
        }

        // Clear hud cursor
        this.scene.visible = false;
    }

    public update() {
        const { dx, dy } = this.input.mouse;
        this.cursor.position.x += dx * 0.5;
        this.cursor.position.y -= dy * 0.5;

        // A bit hacky ... prevents FPS mouse look, when this tool is active
        this.input.mouse.dx = 0;
        this.input.mouse.dy = 0;
    }
}
