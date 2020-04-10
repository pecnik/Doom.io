import Vue from "vue";
import Vuex from "vuex";
import {
    WebGLRenderer,
    Scene,
    PerspectiveCamera,
    Mesh,
    MeshBasicMaterial,
    Vector2,
    Vector3,
    PlaneGeometry
} from "three";
import { Input, KeyCode, MouseBtn } from "../game/core/Input";
import { Level, VoxelType } from "./Level";
import { modulo } from "../game/core/Utils";
import { clamp } from "lodash";
import { disposeMeshMaterial, loadTexture } from "../game/utils/Helpers";
import { BlockTool, PaintTool, SampleTool } from "./Tools";

Vue.use(Vuex);

export enum Tool_ID {
    Block = "Block",
    Paint = "Paint",
    Sample = "Sample"
}

export class Editor {
    public static readonly getInstance = (() => {
        const intance = new Editor();
        return () => intance;
    })();

    public elapsedTime = 0;
    public previusTime = 0;

    public readonly renderer = new WebGLRenderer({});
    public readonly camera = new PerspectiveCamera(90);
    public readonly scene = new Scene();
    public readonly level = new Level();
    public readonly floor = new Mesh();

    public readonly input = new Input({
        requestPointerLock: true,
        element: this.renderer.domElement
    });

    public readonly store = new Vuex.Store({
        state: {
            renderWireframe: true,
            toolId: Tool_ID.Block,
            texture: {
                slots: [0, 1, 2, 3, 8, 9, 10, 11],
                index: 0
            }
        }
    });

    public constructor() {
        this.scene.add(this.floor, this.level.mesh, this.level.wireframe);

        this.store.watch(
            state => state.renderWireframe,
            renderWireframe => {
                this.level.wireframe.visible = renderWireframe;
            }
        );

        this.store.watch(
            state => state.toolId,
            toolId => {
                for (let i = 0; i < this.tools.length; i++) {
                    if (this.tools[i].id === toolId) {
                        this.tools[i].onStart();
                    }
                }
            }
        );
    }

    public getSelectedToolId() {
        return this.store.state.toolId;
    }

    public getSelectedTileId() {
        const { texture } = this.store.state;
        return texture.slots[texture.index];
    }

    public preload() {
        return loadTexture("/assets/tileset.png").then(map => {
            this.level.setMaterial(map);
            this.tools.forEach(tool => tool.onLoad());
        });
    }

    public newLevel(max_x: number, max_y: number, max_z: number) {
        this.level.setSize(max_x, max_y, max_z);
        this.level.data.voxel.forEach(voxel => {
            if (voxel.y === 0) {
                voxel.type = VoxelType.Solid;
                voxel.faces.fill(8);
            }
        });
        this.level.updateGeometry();

        {
            // Reconstruct floor mesh
            this.floor.geometry.dispose();
            this.floor.geometry = new PlaneGeometry(max_x, max_z, max_x, max_z);
            this.floor.geometry.rotateX(-Math.PI / 2);
            this.floor.geometry.translate(-0.5, -0.5, -0.5);
            this.floor.geometry.translate(max_x / 2, 0, max_z / 2);

            disposeMeshMaterial(this.floor.material);
            this.floor.material = new MeshBasicMaterial({
                wireframe: true,
                color: 0xf2f2f2
            });
        }

        this.camera.rotation.set(-Math.PI / 4, 0, 0, "YXZ");
        this.camera.position.set(max_x / 2, max_y / 2, max_z / 2);
    }

    public setActiveTool(toolId: Tool_ID) {
        this.store.state.toolId = toolId;
    }

    public update(elapsed: number) {
        this.previusTime = this.elapsedTime;
        this.elapsedTime = elapsed;

        const delta = (this.elapsedTime - this.previusTime) * 0.001;
        this.movementSystem(delta);
        this.tileSlotSystem();
        this.toolSystem();
        this.input.clear();

        this.renderer.render(this.scene, this.camera);
    }

    private movementSystem(dt: number) {
        // Mouse look
        const str = 0.1;
        const dx = this.input.mouse.dx;
        const dy = this.input.mouse.dy;
        const rotation = this.camera.rotation.clone();
        rotation.y -= dx * str * dt;
        rotation.x -= dy * str * dt;
        rotation.y = modulo(rotation.y, Math.PI * 2);
        rotation.x = clamp(rotation.x, -Math.PI / 2, Math.PI / 2);
        this.camera.rotation.set(rotation.x, rotation.y, 0, "YXZ");

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
        this.camera.position.add(velocity);
    }

    private tileSlotSystem() {
        const { texture } = this.store.state;

        const KEY_NUM_1 = KeyCode.NUM_1 as number;
        for (let i = 0; i < 8; i++) {
            if (this.input.isKeyPressed(KEY_NUM_1 + i)) {
                texture.index = i;
                return;
            }
        }

        const scroll = this.input.mouse.scroll;
        if (scroll !== 0) {
            const offset = clamp(scroll * Number.MAX_SAFE_INTEGER, -1, 1);
            texture.index = modulo(
                texture.index + offset,
                texture.slots.length
            );
        }
    }

    private toolSystem() {
        const toolId = this.getSelectedToolId();
        for (let i = 0; i < this.tools.length; i++) {
            const tool = this.tools[i];

            // Hotkey select tool
            if (this.input.isKeyPressed(tool.hotkey)) {
                this.setActiveTool(tool.id);
            }

            // Tool actions
            if (tool.id === toolId) {
                tool.onUpdate();

                if (this.input.isMousePresed(MouseBtn.Left)) {
                    tool.onMouseDown();
                } else if (this.input.isMouseReleased(MouseBtn.Left)) {
                    tool.onMouseUp();
                }

                if (this.input.isMousePresed(MouseBtn.Right)) {
                    tool.onMouseTwoDown();
                } else if (this.input.isMouseReleased(MouseBtn.Right)) {
                    tool.onMouseTwoUp();
                }
            }
        }
    }

    private readonly tools = [
        new BlockTool(this),
        new PaintTool(this),
        new SampleTool(this)
    ];
}
