import {
    Scene,
    TextureLoader,
    PlaneGeometry,
    MeshBasicMaterial,
    Mesh,
    Object3D,
    AdditiveBlending,
    Intersection,
    Vector2
} from "three";
import { EditorWorld } from "./data/EditorWorld";
import { Input } from "../game/core/Input";
import { HUD_WIDTH, HUD_HEIGHT } from "../game/data/Globals";
import { TILE_COLS, TILE_ROWS } from "./data/Constants";
import { Hitscan } from "../game/utils/EntityUtils";
import { Editor } from "./Editor";
import { EditorHud } from "./data/EditorHud";

const TEXTURE_PANEL_SIZE = HUD_HEIGHT / 2;
const TEXTURE_TILE_SIZE = TEXTURE_PANEL_SIZE / TILE_COLS;

export class EditorTools {
    public readonly hud: EditorHud;
    public readonly world: EditorWorld;
    public readonly input: Input;
    public readonly scene = new Scene();

    private readonly cursor = new Object3D();
    private readonly border = new Object3D();
    public readonly texturePlanel = new Object3D();

    public constructor(editor: Editor) {
        this.hud = editor.hud;
        this.world = editor.world;
        this.input = editor.input;

        this.hud.scene.add(this.scene);

        let order = 1;

        this.texturePlanel.renderOrder = order++;
        this.texturePlanel.position.set(0, 0, -1);

        this.border.renderOrder = order++;
        this.border.position.set(0, 0, -1);

        this.cursor.renderOrder = order++;
        this.cursor.position.set(0, 0, 0);

        this.scene.add(this.texturePlanel, this.border, this.cursor);

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
                TEXTURE_TILE_SIZE,
                TEXTURE_TILE_SIZE
            );
            const material = new MeshBasicMaterial({
                map,
                depthTest: false,
                depthWrite: false,
                blending: AdditiveBlending
            });

            const sprite = new Mesh(geometry, material);
            sprite.renderOrder = this.border.renderOrder;
            sprite.translateX(TEXTURE_TILE_SIZE / 2);
            sprite.translateY(-TEXTURE_TILE_SIZE / 2);
            this.border.add(sprite);
        });

        // Load texture panel
        new TextureLoader().load("/assets/tileset.png", map => {
            const geometry = new PlaneGeometry(
                TEXTURE_PANEL_SIZE,
                TEXTURE_PANEL_SIZE
            );

            const material = new MeshBasicMaterial({
                map,
                depthTest: false,
                depthWrite: false
            });

            const sprite = new Mesh(geometry, material);
            sprite.renderOrder = this.texturePlanel.renderOrder;
            sprite.translateX(TEXTURE_PANEL_SIZE / 2);
            sprite.translateY(-TEXTURE_PANEL_SIZE / 2);
            this.texturePlanel.add(sprite);
        });
    }

    public update(_: number) {
        const { dx, dy } = this.input.mouse;
        this.cursor.position.x += dx * 0.5;
        this.cursor.position.y -= dy * 0.5;

        // A bit hacky ... prevents FPS mouse look, when this tool is active
        this.input.mouse.dx = 0;
        this.input.mouse.dy = 0;

        if (dx !== 0 && dy !== 0) {
            const rsp = this.sampleTextureTile();
            if (rsp !== undefined) {
                this.border.position.copy(this.texturePlanel.position);
                this.border.position.x += rsp.point.x * TEXTURE_TILE_SIZE;
                this.border.position.y -= rsp.point.y * TEXTURE_TILE_SIZE;
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
