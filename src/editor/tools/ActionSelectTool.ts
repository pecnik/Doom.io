import { Tool } from "./Tool";
import {
    Intersection,
    Mesh,
    MeshBasicMaterial,
    PlaneGeometry,
    Object3D,
    TextureLoader,
    Scene,
    AdditiveBlending,
    Vector2
} from "three";
import { Hitscan } from "../../game/utils/EntityUtils";
import { HUD_WIDTH, HUD_HEIGHT } from "../../game/data/Globals";
import { TILE_COLS, TILE_ROWS } from "../data/Constants";
import { GameEditor } from "../GameEditor";

const PANEL_SIZE = HUD_WIDTH / 2;
const PANEL_TILE_SIZE = PANEL_SIZE / TILE_COLS;

export class ActionSelectTool extends Tool {
    private readonly scene = new Scene();
    private readonly cursor = new Object3D();
    private readonly border = new Object3D();
    private readonly texturePlanel = new Object3D();

    private lastUpdate = 0;

    public constructor(editor: GameEditor) {
        super(editor);

        let order = 1;

        this.texturePlanel.renderOrder = order++;
        this.texturePlanel.position.set(0, 0, -1);

        this.border.renderOrder = order++;
        this.border.position.set(0, 0, -1);

        this.cursor.renderOrder = order++;
        this.cursor.position.set(0, 0, 0);

        this.scene.visible = false;
        this.scene.add(this.texturePlanel, this.cursor, this.border);
        this.hud.scene.add(this.scene);

        // Load cursor
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

        // Load border
        new TextureLoader().load("/assets/sprites/editor_border.png", map => {
            const geometry = new PlaneGeometry(
                PANEL_TILE_SIZE,
                PANEL_TILE_SIZE
            );
            const material = new MeshBasicMaterial({
                map,
                depthTest: false,
                depthWrite: false,
                blending: AdditiveBlending
            });

            const sprite = new Mesh(geometry, material);
            sprite.renderOrder = this.border.renderOrder;
            this.border.add(sprite);
        });

        // Load texture panel
        new TextureLoader().load("/assets/tileset.png", map => {
            const geometry = new PlaneGeometry(PANEL_SIZE, PANEL_SIZE);
            const material = new MeshBasicMaterial({
                map,
                depthTest: false,
                depthWrite: false
            });

            const sprite = new Mesh(geometry, material);
            sprite.renderOrder = this.texturePlanel.renderOrder;
            sprite.translateX(PANEL_TILE_SIZE / 2);
            sprite.translateY(PANEL_TILE_SIZE / 2);
            this.texturePlanel.add(sprite);
        });
    }

    public start() {
        this.scene.visible = true;
        this.cursor.position.set(0, 0, 0);
        this.texturePlanel.position.set(HUD_WIDTH * 0.25, 0, -1);
    }

    public end() {
        const rsp = this.sampleTextureTile();
        if (rsp !== undefined) {
            this.world.texutreIndex = rsp.index + 1;
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

        const updateDelta = this.world.elapsedTime - this.lastUpdate;
        if (updateDelta > 0.1) {
            this.lastUpdate = this.world.elapsedTime;
            const rsp = this.sampleTextureTile();
            if (rsp !== undefined) {
                this.border.position.copy(this.texturePlanel.position);

                this.border.position.x -= PANEL_SIZE / 2;
                this.border.position.y += PANEL_SIZE / 2;

                this.border.position.x += (rsp.point.x + 1) * PANEL_TILE_SIZE;
                this.border.position.y -= rsp.point.y * PANEL_TILE_SIZE;
            }
        }
    }

    private sampleTextureTile() {
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
                return {
                    point: new Vector2(x, y),
                    index
                };
            }
        }

        return;
    }
}
