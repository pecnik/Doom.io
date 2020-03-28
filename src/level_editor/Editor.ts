import { Game } from "../game/core/Engine";
import {
    Scene,
    OrthographicCamera,
    Vector2,
    Vector3,
    Object3D,
    PlaneGeometry,
    MeshBasicMaterial,
    Mesh,
    AdditiveBlending
} from "three";
import { EditorWorld } from "./data/EditorWorld";
import { Input, KeyCode, MouseBtn } from "../game/core/Input";
import { clamp } from "lodash";
import { modulo } from "../game/core/Utils";
import { TextureBar } from "./hud/TextureBar";
import { StateInfo } from "./hud/StateInfo";
import { setTextureUV, loadTexture } from "./EditorUtils";
import { TextureSelect } from "./hud/TextureSelect";
import { Tool } from "./tools/Tool";
import { BlockTool } from "./tools/BlockTool";
import { FillTool } from "./tools/FillTool";
import { ToolSelect } from "./hud/ToolSelect";

export const VIEW_WIDTH = 1920;
export const VIEW_HEIGHT = 1080;

export enum EditorState {
    Editor,
    TextureSelect
}

export class Editor implements Game {
    public readonly input = new Input({ requestPointerLock: true });
    public readonly world = new EditorWorld();
    public readonly hud = {
        scene: new Scene(),
        cursor: new Object3D(),
        stateInfo: new StateInfo(),
        toolSelect: new ToolSelect(),
        textureBar: new TextureBar(),
        textureSelect: new TextureSelect(),
        camera: new OrthographicCamera(
            -VIEW_WIDTH / 2,
            VIEW_WIDTH / 2,
            VIEW_HEIGHT / 2,
            -VIEW_HEIGHT / 2,
            0,
            30
        )
    };

    public state = EditorState.Editor;
    public slots = [0, 1, 2, 3, 4, 5, 6, 7];
    public activeSlot = 0;

    public tools: Tool[] = [new BlockTool(this), new FillTool(this)];
    public tool: Tool = this.tools[0];

    public preload(): Promise<any> {
        return Promise.all([
            // Load level texture
            loadTexture("/assets/tileset.png").then(map => {
                this.world.level.textrue = map;
                this.hud.textureBar.init(map);
                this.hud.textureSelect.init(map);
                this.hud.toolSelect.init(this.tools);
            }),

            // Load cursor
            loadTexture("/assets/sprites/editor_cursor.png").then(map => {
                const size = 32;
                const geo = new PlaneGeometry(size, size);
                const mat = new MeshBasicMaterial({
                    map,
                    transparent: true
                });
                const sprite = new Mesh(geo, mat);
                sprite.position.x += size / 2;
                sprite.position.y -= size / 2;
                this.hud.cursor.add(sprite);
            }),

            // Load crosshair
            loadTexture("/assets/sprites/crosshair.png").then(map => {
                const size = 128;
                const geo = new PlaneGeometry(size, size);
                const mat = new MeshBasicMaterial({
                    map,
                    blending: AdditiveBlending
                });
                const crosshair = new Mesh(geo, mat);
                crosshair.position.z = -1;
                this.hud.scene.add(crosshair);
            })
        ]);
    }

    public create(): void {
        let order = 1;
        this.hud.cursor.renderOrder = order++;
        this.hud.stateInfo.scene.renderOrder = order++;
        this.hud.toolSelect.scene.renderOrder = order++;
        this.hud.textureBar.scene.renderOrder = order++;
        this.hud.textureSelect.scene.renderOrder = order++;
        this.hud.scene.add(
            this.hud.cursor,
            this.hud.toolSelect.scene,
            this.hud.stateInfo.scene,
            this.hud.textureBar.scene,
            this.hud.textureSelect.scene
        );

        this.setState(EditorState.Editor);
    }

    public update(dt: number) {
        this.stateMachine(dt);
        this.input.clear();
    }

    private setState(state: EditorState) {
        const prev = EditorState[this.state];
        const next = EditorState[state];
        console.log(`> Editor: ${prev} => ${next}`);

        this.state = state;

        if (this.state === EditorState.Editor) {
            this.hud.cursor.position.set(0, 0, 0);
            this.hud.cursor.visible = false;
            this.hud.toolSelect.scene.visible = false;
            this.hud.textureSelect.scene.visible = false;
        }

        if (this.state === EditorState.TextureSelect) {
            this.hud.cursor.position.set(0, 0, 0);
            this.hud.cursor.visible = true;
            this.hud.toolSelect.scene.visible = true;
            this.hud.textureSelect.scene.visible = true;
        }

        // Update info
        this.updateInfo();
    }

    private updateInfo() {
        const tiles = this.hud.textureBar.slots.children;
        for (let i = 0; i < this.slots.length; i++) {
            // Scale up selected slot
            const tile = tiles[i] as Mesh;
            if (i === this.activeSlot) {
                tile.scale.setScalar(1.125);
            } else {
                tile.scale.setScalar(0.75);
            }

            const geo = tile.geometry as PlaneGeometry;
            geo.elementsNeedUpdate = true;
            setTextureUV(geo, this.slots[i]);
        }

        // Rerender info panel
        const { width, height, ctx, texture } = this.hud.stateInfo;
        ctx.clearRect(0, 0, width, height);
        ctx.font = "30px Arial";
        ctx.fillStyle = "white";

        const x1 = 16;
        const x2 = 150;
        let line = 1;

        ctx.fillText(`State:`, x1, 32 * line);
        ctx.fillText(EditorState[this.state], x2, 32 * line);
        line++;

        ctx.fillText(`Tool:`, x1, 32 * line);
        ctx.fillText(this.tool.name, x2, 32 * line);
        line++;

        ctx.fillText(`Slot:`, x1, 32 * line);
        ctx.fillText(this.activeSlot.toString(), x2, 32 * line);
        line++;

        ctx.fillText(`Texture:`, x1, 32 * line);
        ctx.fillText(this.slots[this.activeSlot].toString(), x2, 32 * line);
        line++;

        texture.needsUpdate = true;
    }

    private stateMachine(dt: number) {
        if (this.state === EditorState.Editor) {
            if (this.input.isKeyPressed(KeyCode.TAB)) {
                return this.setState(EditorState.TextureSelect);
            }

            this.movementSystem(dt);
            this.slotScrollSystem(dt);

            const mouse1 = this.input.isMousePresed(MouseBtn.Left);
            const mouse2 = this.input.isMousePresed(MouseBtn.Right);
            if (mouse1) this.tool.onMouseOne();
            if (mouse2) this.tool.onMouseTwo();
        }

        if (this.state === EditorState.TextureSelect) {
            if (this.input.isKeyPressed(KeyCode.TAB)) {
                return this.setState(EditorState.Editor);
            }

            if (this.input.isMousePresed(MouseBtn.Left)) {
                const { x, y } = this.hud.cursor.position;

                // Test slot select
                const barSlots = this.hud.textureBar.slots.children;
                for (let i = 0; i < this.slots.length; i++) {
                    const tile = barSlots[i] as Mesh;
                    tile.geometry.computeBoundingBox();

                    const { min, max } = tile.geometry.boundingBox;
                    min.add(tile.position);
                    max.add(tile.position);
                    if (x < min.x || x > max.x) continue;
                    if (y < min.y || y > max.y) continue;

                    console.log(`> Editor: select slot #${i + 1}`);
                    this.activeSlot = i;
                    this.updateInfo();
                    return;
                }

                // Test texture select
                const selectSlots = this.hud.textureSelect.slots.children;
                for (let i = 0; i < selectSlots.length; i++) {
                    const tile = selectSlots[i] as Mesh;
                    tile.geometry.computeBoundingBox();

                    const { min, max } = tile.geometry.boundingBox;
                    min.add(tile.position);
                    max.add(tile.position);
                    if (x < min.x || x > max.x) continue;
                    if (y < min.y || y > max.y) continue;

                    const slot = this.activeSlot;
                    console.log(`> Editor: set slot #${slot} to #${i + 1}`);
                    this.slots[this.activeSlot] = i;
                    this.updateInfo();
                    return;
                }

                // Test texture select
                const toolSlots = this.hud.toolSelect.slots.children;
                for (let i = 0; i < toolSlots.length; i++) {
                    const tile = toolSlots[i] as Mesh;
                    tile.geometry.computeBoundingBox();

                    const { min, max } = tile.geometry.boundingBox;
                    min.add(tile.position);
                    max.add(tile.position);
                    if (x < min.x || x > max.x) continue;
                    if (y < min.y || y > max.y) continue;

                    console.log(`> Editor: select tool #${i + 1}`);
                    this.tool = this.tools[i];
                    this.updateInfo();
                    return this.setState(EditorState.Editor);
                }

                return this.setState(EditorState.Editor);
            }

            this.cursorSystem(dt);
            this.slotScrollSystem(dt);
        }
    }

    private movementSystem(dt: number) {
        // Mouse look
        const str = 0.1;
        const dx = this.input.mouse.dx;
        const dy = this.input.mouse.dy;
        const rotation = this.world.camera.rotation.clone();
        rotation.y -= dx * str * dt;
        rotation.x -= dy * str * dt;
        rotation.y = modulo(rotation.y, Math.PI * 2);
        rotation.x = clamp(rotation.x, -Math.PI / 2, Math.PI / 2);
        this.world.camera.rotation.set(rotation.x, rotation.y, 0, "YXZ");

        // Move
        const forward = this.input.isKeyDown(KeyCode.W);
        const backward = this.input.isKeyDown(KeyCode.S);
        const left = this.input.isKeyDown(KeyCode.A);
        const right = this.input.isKeyDown(KeyCode.D);
        const up = this.input.isKeyDown(KeyCode.SPACE);
        const down = this.input.isKeyDown(KeyCode.SHIFT);

        const move = new Vector2();
        move.x = (left ? -1 : 0) + (right ? 1 : 0);
        move.y = (forward ? -1 : 0) + (backward ? 1 : 0);
        if (move.x !== 0 || move.y !== 0) {
            move.rotateAround(new Vector2(), -rotation.y);
        }

        const fly = (down ? -1 : 0) + (up ? 1 : 0);
        const velocity = new Vector3(move.x, fly, move.y);
        velocity
            .normalize()
            .multiplyScalar(5)
            .multiplyScalar(dt);
        this.world.camera.position.add(velocity);
    }

    private cursorSystem(dt: number) {
        const str = 50;
        const { dx, dy } = this.input.mouse;

        const point = this.hud.cursor.position;
        point.x += dx * dt * str;
        point.y -= dy * dt * str;

        const clampx = VIEW_WIDTH * 0.5;
        const clampy = VIEW_HEIGHT * 0.5;
        point.x = clamp(point.x, -clampx, clampx);
        point.y = clamp(point.y, -clampy, clampy);
    }

    private slotScrollSystem(_: number) {
        let { scroll } = this.input.mouse;
        if (scroll !== 0) {
            scroll *= Number.MAX_SAFE_INTEGER;
            scroll = clamp(scroll, -1, 1);

            this.activeSlot = modulo(this.activeSlot + scroll, 8);
            this.updateInfo();
        }
    }
}
