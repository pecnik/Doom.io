import { Game } from "../game/core/Engine";
import {
    Scene,
    OrthographicCamera,
    TextureLoader,
    Vector2,
    Vector3,
    Object3D,
    Texture,
    PlaneGeometry,
    MeshBasicMaterial,
    Mesh,
    NearestFilter
} from "three";
import { EditorWorld } from "./data/EditorWorld";
import { Input, KeyCode, MouseBtn } from "../game/core/Input";
import { clamp } from "lodash";
import { modulo } from "../game/core/Utils";
import { TextureBar } from "./hud/TextureBar";
import { StateInfo } from "./hud/StateInfo";

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
        textrueBar: new TextureBar(),
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
    public activeSlot = 0;

    public preload(): Promise<any> {
        const loadTexture = (src: string): Promise<Texture> => {
            return new Promise(resolve => {
                new TextureLoader().load(src, map => {
                    map.minFilter = NearestFilter;
                    map.magFilter = NearestFilter;
                    resolve(map);
                });
            });
        };

        return Promise.all([
            // Load level texture
            loadTexture("/assets/tileset.png").then(map => {
                this.world.level.textrue = map;
            }),

            // Load cursor
            loadTexture("/assets/sprites/editor_cursor.png").then(map => {
                const geo = new PlaneGeometry(32, 32);
                const mat = new MeshBasicMaterial({
                    map,
                    transparent: true
                });
                this.hud.cursor.add(new Mesh(geo, mat));
            })
        ]);
    }

    public create(): void {
        let order = 1;
        this.hud.cursor.renderOrder = order++;
        this.hud.stateInfo.scene.renderOrder = order++;
        this.hud.textrueBar.scene.renderOrder = order++;
        this.hud.scene.add(
            this.hud.cursor,
            this.hud.stateInfo.scene,
            this.hud.textrueBar.scene
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
        }

        if (this.state === EditorState.TextureSelect) {
            // ...
        }

        // Update info
        this.updateInfo();
    }

    private updateInfo() {
        // Scale up selected slot
        const slots = this.hud.textrueBar.slots.children;
        for (let i = 0; i < slots.length; i++) {
            const slot = slots[i];
            if (i === this.activeSlot) {
                slot.scale.setScalar(1.125);
            } else {
                slot.scale.setScalar(1);
            }
        }

        // Rerender info panel
        const { width, height, ctx, texture } = this.hud.stateInfo;
        ctx.clearRect(0, 0, width, height);
        ctx.font = "30px Arial";
        ctx.fillStyle = "white";

        const x1 = 24;
        const x2 = 128;
        let line = 1;

        ctx.fillText(`State:`, x1, 32 * line);
        ctx.fillText(EditorState[this.state], x2, 32 * line);
        line++;

        ctx.fillText(`Slot:`, x1, 32 * line);
        ctx.fillText(this.activeSlot.toString(), x2, 32 * line);
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
        }

        if (this.state === EditorState.TextureSelect) {
            if (this.input.isKeyPressed(KeyCode.TAB)) {
                return this.setState(EditorState.Editor);
            }

            if (this.input.isMouseDown(MouseBtn.Left)) {
                const { x, y } = this.hud.cursor.position;
                const slots = this.hud.textrueBar.slots.children;

                for (let i = 0; i < slots.length; i++) {
                    const slot = slots[i] as Mesh;
                    slot.geometry.computeBoundingBox();

                    const { min, max } = slot.geometry.boundingBox;
                    min.add(slot.position);
                    max.add(slot.position);
                    if (x < min.x || x > max.x) continue;
                    if (y < min.y || y > max.y) continue;

                    console.log(`> Editor: select slot #${i + 1}`);
                    this.activeSlot = i;
                    this.updateInfo();
                    return;
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
        this.hud.cursor.position.x += dx * dt * str;
        this.hud.cursor.position.y -= dy * dt * str;
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
