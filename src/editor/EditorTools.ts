import {
    Scene,
    TextureLoader,
    PlaneGeometry,
    MeshBasicMaterial,
    Mesh,
    Object3D,
    AdditiveBlending,
    Intersection,
    Vector2,
    Group
} from "three";
import { EditorWorld } from "./data/EditorWorld";
import { Input, KeyCode, MouseBtn } from "../game/core/Input";
import { HUD_WIDTH, HUD_HEIGHT } from "../game/data/Globals";
import { TILE_COLS, TILE_ROWS } from "./data/Constants";
import { Hitscan } from "../game/utils/EntityUtils";
import { Editor } from "./Editor";
import { EditorHud } from "./data/EditorHud";
import { setTextureUV } from "./EditorUtils";
import { BlockTool } from "./tools/BlockTool";
import { Tool } from "./tools/Tool";
import { FillTool } from "./tools/FillTool";

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
    private readonly toolPanel = new Group();
    private readonly texturePlanel = new Object3D();

    // Texture preview
    private textureIndex = 0;
    private texturePreview = new Mesh();

    // Tools
    private readonly tools: Tool[];
    private tool: Tool;

    public constructor(editor: Editor) {
        this.hud = editor.hud;
        this.world = editor.world;
        this.input = editor.input;

        this.tools = [new BlockTool(editor), new FillTool(editor)];
        this.tool = this.tools[0];

        this.initMenu();
        this.hud.scene.add(this.menu);
    }

    private initMenu() {
        let order = 1;

        this.toolPanel.renderOrder = order++;
        this.texturePlanel.renderOrder = order++;
        this.texturePreview.renderOrder = order++;
        this.border.renderOrder = order++;
        this.cursor.renderOrder = order++;

        this.menu.add(
            this.toolPanel,
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
                transparent: true
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

        // Load tool icons
        this.tools.forEach((tool, index) => {
            const icon = new Object3D();
            this.toolPanel.add(icon);
            new TextureLoader().load(tool.icon, map => {
                const PADD = TEXTURE_TILE_SIZE / 4;
                const SIZE = TEXTURE_TILE_SIZE;
                const geometry = new PlaneGeometry(SIZE, SIZE);
                const material = new MeshBasicMaterial({
                    map,
                    depthTest: false,
                    depthWrite: false
                });

                icon.add(new Mesh(geometry, material));
                icon.position.x = SIZE / 2 + (SIZE + PADD) * index;
                icon.position.y = SIZE / 2 + PADD;
            });
        });
    }

    public update(_: number) {
        this.menu.visible = this.input.isKeyDown(KeyCode.TAB);
        if (this.menu.visible) {
            this.updateMenu();
            return;
        }

        if (this.input.isKeyReleased(KeyCode.TAB)) {
            // Select texture
            const rsp = this.sampleTextureTile(this.texturePlanel);
            if (rsp !== undefined) {
                this.world.texutreIndex = rsp.index;
            } else {
                this.updateTexturePreview(this.world.texutreIndex);
            }

            // Select tool
            for (let i = 0; i < this.toolPanel.children.length; i++) {
                const panel = this.toolPanel.children[i];
                const rsp = this.sampleTextureTile(panel);
                if (rsp !== undefined) {
                    this.tool = this.tools[i];
                }
            }
        }

        const mouse1 = this.input.isMousePresed(MouseBtn.Left);
        const mouse2 = this.input.isMousePresed(MouseBtn.Right);
        if (mouse1) this.tool.onMouseOne();
        if (mouse2) this.tool.onMouseTwo();
    }

    private updateMenu() {
        const { dx, dy } = this.input.mouse;
        this.cursor.position.x += dx * 0.5;
        this.cursor.position.y -= dy * 0.5;

        // A bit hacky ... prevents FPS mouse look, when this tool is active
        this.input.mouse.dx = 0;
        this.input.mouse.dy = 0;

        if (dx === 0 && dy === 0) {
            return;
        }

        // Select texture
        const rsp = this.sampleTextureTile(this.texturePlanel);
        if (rsp !== undefined) {
            this.border.position.copy(this.texturePlanel.position);
            this.border.position.x += rsp.point.x * TEXTURE_TILE_SIZE;
            this.border.position.y -= rsp.point.y * TEXTURE_TILE_SIZE;
            if (this.textureIndex !== rsp.index) {
                this.textureIndex = rsp.index;
                this.updateTexturePreview(this.textureIndex);
                return;
            }
        }

        // Select tool
        for (let i = 0; i < this.toolPanel.children.length; i++) {
            const panel = this.toolPanel.children[i];
            const rsp = this.sampleTextureTile(panel);
            if (rsp !== undefined) {
                this.border.position.copy(panel.position);
                this.border.position.x -= TEXTURE_TILE_SIZE / 2;
                this.border.position.y += TEXTURE_TILE_SIZE / 2;
                return;
            }
        }
    }

    private updateTexturePreview(index = this.world.texutreIndex) {
        const geometry = this.texturePreview.geometry as PlaneGeometry;
        geometry.elementsNeedUpdate = true;
        setTextureUV(geometry, index);
    }

    private sampleTextureTile(texture: Object3D) {
        // Hitscan
        const cursor = this.cursor.position;
        const buffer: Intersection[] = [];
        Hitscan.origin.set(
            cursor.x / (HUD_WIDTH / 2),
            cursor.y / (HUD_HEIGHT / 2)
        );
        Hitscan.raycaster.setFromCamera(Hitscan.origin, this.hud.camera);
        Hitscan.raycaster.intersectObject(texture, true, buffer);

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
