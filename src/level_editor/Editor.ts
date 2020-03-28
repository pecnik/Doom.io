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
import { loadTexture, setTextureUV } from "./EditorUtils";
import { Tool } from "./tools/Tool";
import { BlockTool } from "./tools/BlockTool";
import { FillTool } from "./tools/FillTool";
import { EditorMenu } from "./data/EditorMenu";

export const VIEW_WIDTH = 1920;
export const VIEW_HEIGHT = 1080;

export class Editor implements Game {
    public readonly input = new Input({ requestPointerLock: true });
    public readonly world = new EditorWorld();
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

    public readonly menu = new EditorMenu();
    public readonly textureSlotsBar = this.menu.addGroup();

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

        const slotCount = this.world.textureSlots.length;
        for (let i = 0; i < slotCount; i++) {
            const state = { tileId: -1 };

            const size = 128;
            const padd = 0;
            const offsetx = (size + padd) * slotCount * 0.5;
            const offsety = VIEW_HEIGHT / 2;

            const map = this.world.level.textrue;
            const geo = new PlaneGeometry(size, size);
            const mat = new MeshBasicMaterial({ map });
            const button = new Mesh(geo, mat);
            button.position.x += (size + padd) * i - offsetx;
            button.position.y += size - offsety;

            const outlineMat = new MeshBasicMaterial({
                color: 0x00ff55
            });
            const outline = new Mesh(geo, outlineMat);
            outline.position.z = -1;
            outline.scale.setScalar(1.05);
            button.add(outline);

            const onClick = () => {
                this.world.selectedSlot = i;
            };

            const onUpdate = () => {
                if (state.tileId !== this.world.textureSlots[i]) {
                    state.tileId = this.world.textureSlots[i];
                    setTextureUV(geo, state.tileId);
                }

                if (state.tileId !== this.world.selectedSlot) {
                    button.scale.setScalar(0.75);
                } else {
                    button.scale.setScalar(1);
                }
            };

            this.textureSlotsBar.addButton({
                mesh: button,
                onClick,
                onUpdate
            });
        }
    }

    // UPDATE LOOP
    // ======================================

    public update(dt: number) {
        if (this.input.isKeyPressed(KeyCode.TAB)) {
            this.toggleMenu(!this.isMenuOpen);
        }

        if (this.isMenuOpen) {
            this.updateMenu(dt);
        } else {
            this.updateEditor(dt);
        }

        this.input.clear();
    }

    private updateMenu(dt: number) {
        this.cursorSystem(dt);
        this.menuClickSystem(dt);
        this.menuUpdateSystem(dt);
        this.selectSlotSystem(dt);
    }

    private updateEditor(dt: number) {
        this.toolSystem(dt);
        this.movementSystem(dt);
        this.menuClickSystem(dt);
        this.menuUpdateSystem(dt);
        this.selectSlotSystem(dt);
    }

    private toggleMenu(value: boolean) {
        this.isMenuOpen = value;
        this.hud.cursor.visible = value;
        this.hud.cursor.position.set(0, 0, 0);
    }

    // SYSTEMS
    // ======================================

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

    private menuUpdateSystem(_: number) {
        this.menu.groups.forEach(group => {
            if (group.visible) {
                group.buttons.forEach(btn => {
                    btn.onUpdate();
                });
            }
        });
    }

    private menuClickSystem(_: number) {
        const mouseDown = this.input.isMousePresed(MouseBtn.Left);
        if (!mouseDown) return;

        this.menu.groups.forEach(group => {
            if (group.visible) {
                group.buttons.forEach(btn => {
                    const { x, y } = this.hud.cursor.position;
                    const { min, max } = btn.aabb;
                    if (x < min.x || x > max.x) return;
                    if (y < min.y || y > max.y) return;
                    btn.onClick();
                });
            }
        });
    }

    private selectSlotSystem(_: number) {
        const KEY_NUM_1 = KeyCode.NUM_1 as number;
        const MAX_INDEX = this.world.textureSlots.length;
        for (let i = 0; i < MAX_INDEX; i++) {
            if (this.input.isKeyPressed(KEY_NUM_1 + i)) {
                this.world.selectedSlot = i;
                return;
            }
        }

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
}
