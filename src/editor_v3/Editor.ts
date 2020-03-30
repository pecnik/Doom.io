import Vue from "vue";
import App from "./vue/App.vue";
import { Game } from "../game/core/Engine";
import { EditorHud } from "./store/EditorHud";
import { Input, KeyCode, MouseBtn } from "../game/core/Input";
import { createStore } from "./store/EditorStore";
import { EditorWorld } from "./store/EditorWorld";
import { modulo } from "../game/core/Utils";
import { clamp } from "lodash";
import {
    Vector2,
    Vector3,
    Mesh,
    PlaneGeometry,
    MeshBasicMaterial,
    AdditiveBlending
} from "three";
import { loadTexture } from "./EditorUtils";

export class Editor implements Game {
    public readonly hud = new EditorHud();
    public readonly world = new EditorWorld();
    public readonly input = new Input({
        requestPointerLock: true,
        element: document.getElementById("viewport") as HTMLElement
    });

    public readonly store = createStore(this.world);
    public readonly vue = new Vue({
        store: this.store,
        render: h => h(App)
    }).$mount("#ui-layer");

    public preload() {
        return Promise.all([
            // Load level tileset texture
            loadTexture("/assets/tileset.png").then(map => {
                this.world.texture = map;
            }),

            // Load crosshair sprite
            loadTexture("/assets/sprites/crosshair.png").then(map => {
                const size = 128;
                const geo = new PlaneGeometry(size, size);
                const mat = new MeshBasicMaterial({
                    map,
                    blending: AdditiveBlending
                });
                this.hud.scene.add(new Mesh(geo, mat));
            })
        ]);
    }

    public create() {
        this.store.dispatch("initLevel", {
            width: 16,
            height: 4,
            depth: 16
        });

        document.addEventListener("pointerlockchange", () => {
            if (this.input.isLocked() && this.store.state.tileSelectDialog) {
                this.store.dispatch("setTileSelectDialog", false);
            }
        });
    }

    public update(dt: number) {
        this.world.elapsedTime += dt;
        this.movementSystem(dt);
        this.toolSystem();
        this.input.clear();
    }

    private toolSystem() {
        const mouse1 = this.input.isMousePresed(MouseBtn.Left);
        const mouse2 = this.input.isMousePresed(MouseBtn.Right);

        if (mouse1) {
            this.store.dispatch("placeVoxel");
        }

        if (mouse2) {
            this.store.dispatch("removeVoxel");
        }

        // Select active slot
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
        velocity
            .normalize()
            .multiplyScalar(5)
            .multiplyScalar(dt);
        this.world.camera.position.add(velocity);
    }
}
