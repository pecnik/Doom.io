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
import { Input, KeyCode } from "../game/core/Input";
import { HUD_WIDTH, HUD_HEIGHT } from "../game/data/Globals";
import { TILE_COLS, TILE_ROWS } from "./data/Constants";
import { Hitscan } from "../game/utils/EntityUtils";
import { Editor } from "./Editor";
import { EditorHud } from "./data/EditorHud";
import { setTextureUV } from "./EditorUtils";

const TEXTURE_PANEL_SIZE = HUD_HEIGHT / 2;
const TEXTURE_TILE_SIZE = TEXTURE_PANEL_SIZE / TILE_COLS;

export class EditorTools {
    public readonly hud: EditorHud;
    public readonly world: EditorWorld;
    public readonly input: Input;

    // Menu data
    public readonly menu = new Scene();
    private readonly cursor = new Object3D();
    private readonly border = new Object3D();
    private readonly texturePlanel = new Object3D();

    // Texture preview
    private textureIndex = 0;
    private texturePreview = new Mesh();

    public constructor(editor: Editor) {
        this.hud = editor.hud;
        this.world = editor.world;
        this.input = editor.input;

        this.hud.scene.add(this.menu);

        let order = 1;

        this.texturePlanel.renderOrder = order++;
        this.texturePreview.renderOrder = order++;
        this.border.renderOrder = order++;
        this.cursor.renderOrder = order++;

        this.menu.add(
            this.texturePlanel,
            this.texturePreview,
            this.border,
            this.cursor
        );

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

            {
                // Preview
                const SIZE = TEXTURE_TILE_SIZE * 2;
                const geometry = new PlaneGeometry(SIZE, SIZE);

                const material = new MeshBasicMaterial({
                    map,
                    depthTest: false,
                    depthWrite: false
                });

                this.texturePreview = new Mesh(geometry, material);
                this.texturePreview.translateX(-SIZE / 2);
                this.texturePreview.translateY(-SIZE / 2);
                this.texturePreview.translateX(HUD_WIDTH / 2);
                this.texturePreview.translateY(HUD_HEIGHT / 2);
                this.hud.scene.add(this.texturePreview);
                this.updateTexturePreview();
            }
        });
    }

    public update(_: number) {
        const openMenu = this.input.isKeyDown(KeyCode.TAB);

        this.menu.visible = openMenu;

        if (openMenu) {
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

                    if (this.textureIndex !== rsp.index) {
                        this.textureIndex = rsp.index;
                        this.updateTexturePreview(this.textureIndex);
                    }
                }
            }
        } else {
            // ...
        }
    }

    private updateTexturePreview(index = this.world.texutreIndex) {
        const geometry = this.texturePreview.geometry as PlaneGeometry;
        geometry.elementsNeedUpdate = true;
        setTextureUV(geometry, index);
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
                const index = y * TILE_COLS + x + 1;
                return {
                    point: new Vector2(x, y),
                    index
                };
            }
        }

        return;
    }
}
