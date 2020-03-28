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
import { loadTexture } from "./EditorUtils";
import { Tool } from "./tools/Tool";
import { BlockTool } from "./tools/BlockTool";
import { FillTool } from "./tools/FillTool";
import { EditorMenu } from "./data/EditorMenu";

export const VIEW_WIDTH = 1920;
export const VIEW_HEIGHT = 1080;

export class Editor implements Game {
    public readonly input = new Input({ requestPointerLock: true });
    public readonly world = new EditorWorld();
    public readonly menu = new EditorMenu();
    public readonly hud = {
        scene: new Scene(),
        cursor: new Object3D(),
        camera: new OrthographicCamera(
            -VIEW_WIDTH / 2,
            VIEW_WIDTH / 2,
            VIEW_HEIGHT / 2,
            -VIEW_HEIGHT / 2,
            0,
            30
        )
    };

    public isMenuOpen = false;
    public tools: Tool[] = [new BlockTool(this), new FillTool(this)];
    public tool: Tool = this.tools[0];

    public preload(): Promise<any> {
        return Promise.all([
            // Load level texture
            loadTexture("/assets/tileset.png").then(map => {
                this.world.level.textrue = map;
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
        this.hud.scene.add(this.hud.cursor, this.menu.scene);
        this.toggleMenu(false);
    }

    public update(dt: number) {
        this.isMenuOpen ? this.updateMenu(dt) : this.updateEditor(dt);
        this.input.clear();
    }

    private toggleMenu(value: boolean) {
        this.isMenuOpen = value;
        this.hud.cursor.visible = value;
        this.hud.cursor.position.set(0, 0, 0);
    }

    private updateMenu(dt: number) {
        if (this.input.isKeyPressed(KeyCode.TAB)) {
            return this.toggleMenu(false);
        }

        if (this.input.isMousePresed(MouseBtn.Left)) {
            return this.toggleMenu(false);
        }

        this.cursorSystem(dt);
        this.slotScrollSystem(dt);
    }

    private updateEditor(dt: number) {
        if (this.input.isKeyPressed(KeyCode.TAB)) {
            return this.toggleMenu(true);
        }

        this.toolSystem(dt);
        this.movementSystem(dt);
        this.slotScrollSystem(dt);
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

    private toolSystem(_: number) {
        const mouse1 = this.input.isMousePresed(MouseBtn.Left);
        const mouse2 = this.input.isMousePresed(MouseBtn.Right);
        if (mouse1) this.tool.onMouseOne();
        if (mouse2) this.tool.onMouseTwo();
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
            this.world.selectedSlot = modulo(
                this.world.selectedSlot + scroll,
                this.world.textureSlots.length
            );
        }
    }
}
