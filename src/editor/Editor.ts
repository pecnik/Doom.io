import Vue from "vue";
import App from "./vue/App.vue";
import { Vector2, Vector3, Texture, TextureLoader, NearestFilter } from "three";
import { Game } from "../game/core/Engine";
import { EditorHud } from "./store/EditorHud";
import { Input, KeyCode, MouseBtn } from "../game/core/Input";
import { createStore } from "./store/EditorStore";
import { EditorWorld } from "./store/EditorWorld";
import { modulo } from "../game/core/Utils";
import { clamp } from "lodash";
import { EditorTool } from "./store/EditorState";

export class Editor implements Game {
    public readonly hud = new EditorHud();
    public readonly world = new EditorWorld();
    public readonly input = new Input({
        requestPointerLock: true,
        element: document.getElementById("viewport") as HTMLElement,
    });

    public readonly store = createStore(this.world);
    public readonly vue = new Vue({
        store: this.store,
        render: (h) => h(App),
    }).$mount("#ui-layer");

    public readonly tools = [
        {
            type: EditorTool.Block,
            hotkey: KeyCode.E,
            onMouseOne: () => this.store.dispatch("placeVoxel"),
            onMouseTwo: () => this.store.dispatch("removeVoxel"),
        },
        {
            type: EditorTool.Paint,
            hotkey: KeyCode.F,
            onMouseOne: () => this.store.dispatch("fillVoxelFace"),
            onMouseTwo: () => this.store.dispatch("fillVoxel"),
        },
        {
            type: EditorTool.Pick,
            hotkey: KeyCode.ALT,
            onMouseOne: () => this.store.dispatch("sampleVoxel"),
        },
    ];

    public preload() {
        const loadTexture = (src: string): Promise<Texture> => {
            return new Promise((resolve) => {
                new TextureLoader().load(src, (map) => {
                    map.minFilter = NearestFilter;
                    map.magFilter = NearestFilter;
                    resolve(map);
                });
            });
        };

        return Promise.all([
            // Load level tileset texture
            loadTexture("/assets/tileset.png").then((map) => {
                this.world.level.texture = map;
            }),
        ]);
    }

    public create() {
        this.store.dispatch("initLevel");

        document.addEventListener("pointerlockchange", () => {
            if (this.input.isLocked() && this.store.state.tileSelectDialog) {
                this.store.dispatch("setTileSelectDialog", false);
            }
        });
    }

    public update(dt: number) {
        this.world.elapsedTime += dt;
        this.movementSystem(dt);
        this.tileSlotSystem();
        this.toolSystem();
        this.input.clear();
    }

    private toolSystem() {
        for (let i = 0; i < this.tools.length; i++) {
            const tool = this.tools[i];
            if (this.input.isKeyPressed(tool.hotkey)) {
                this.store.dispatch("setTool", tool.type);
            }

            if (this.input.isMousePresed(MouseBtn.Left)) {
                if (tool.onMouseOne && tool.type === this.store.state.tool) {
                    tool.onMouseOne();
                }
            }

            if (this.input.isMousePresed(MouseBtn.Right)) {
                if (tool.onMouseTwo && tool.type === this.store.state.tool) {
                    tool.onMouseTwo();
                }
            }
        }
    }

    private tileSlotSystem() {
        const KEY_NUM_1 = KeyCode.NUM_1 as number;
        for (let i = 0; i < 6; i++) {
            if (this.input.isKeyPressed(KEY_NUM_1 + i)) {
                this.store.dispatch("setTileIdSlotIndex", i);
                return;
            }
        }

        const scroll = this.input.mouse.scroll;
        if (scroll !== 0) {
            const offset = clamp(scroll * Number.MAX_SAFE_INTEGER, -1, 1);
            const index = modulo(
                this.store.state.tileIdSlotIndex + offset,
                this.store.state.tileIdSlotArray.length
            );
            this.store.dispatch("setTileIdSlotIndex", index);
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
        velocity.normalize().multiplyScalar(5).multiplyScalar(dt);
        this.world.camera.position.add(velocity);
    }
}
