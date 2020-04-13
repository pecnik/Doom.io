import {
    WebGLRenderer,
    Scene,
    PerspectiveCamera,
    Mesh,
    Vector2,
    Vector3,
    PlaneGeometry,
    MeshBasicMaterial
} from "three";
import { store } from "./Store";
import { Input, KeyCode, MouseBtn } from "../game/core/Input";
import { Level } from "../game/data/Level";
import { modulo } from "../game/core/Utils";
import { clamp } from "lodash";
import { loadTexture, disposeMeshMaterial } from "../game/utils/Helpers";
import { Tool } from "./tools/Tool";
import { BlockTool } from "./tools/BlockTool";
import { EntityTool } from "./tools/EntityTool";
import { PaintTool } from "./tools/PaintTool";
import { EraseTool } from "./tools/EraseTool";

export class Editor {
    public elapsedTime = 0;
    public previusTime = 0;

    public readonly renderer = new WebGLRenderer({ antialias: true });
    public readonly camera = new PerspectiveCamera(90);
    public readonly scene = new Scene();
    public readonly level = new Level();
    public readonly floor = new Mesh();
    public readonly input = new Input({
        requestPointerLock: true,
        element: this.renderer.domElement
    });

    public readonly tools: {
        active: Tool;
        list: Tool[];
    };

    public constructor() {
        const [max_x, max_y, max_z] = [32, 32, 32];

        // Init level data
        this.level.setSize(max_x, max_y, max_z);

        // Build scene
        this.scene.add(
            this.camera,
            this.floor,
            this.level.mesh,
            this.level.wireframe
        );

        // Set camera
        this.camera.position.y = 2;
        this.camera.rotation.set(0, -1.8, 0, "XYZ");

        // Reconstruct floor mesh
        this.floor.geometry.dispose();
        this.floor.geometry = new PlaneGeometry(max_x, max_z, max_x, max_z);
        this.floor.geometry.rotateX(-Math.PI / 2);
        this.floor.geometry.translate(-0.5, -0.5, -0.5);
        this.floor.geometry.translate(max_x / 2, 0, max_z / 2);

        disposeMeshMaterial(this.floor.material);
        this.floor.material = new MeshBasicMaterial({
            wireframe: true,
            transparent: true,
            opacity: 0.25,
            color: 0xffffff
        });

        // Init tools
        const toolList = [
            new BlockTool(this),
            new EraseTool(this),
            new PaintTool(this),
            new EntityTool(this)
        ];

        const getToolNyName = (name: string): Tool => {
            const tool = toolList.find(t => t.name === name);
            return tool || toolList[0];
        };

        this.tools = {
            active: getToolNyName("block"),
            list: toolList
        };

        store.watch(
            state => state.toolId,
            (toolId, prevId) => {
                const prev = getToolNyName(prevId);
                const next = getToolNyName(toolId);
                prev.end();
                next.start();
                this.tools.active = next;
            }
        );

        store.watch(
            state => state.renderWireframe,
            renderWireframe => {
                this.level.wireframe.visible = renderWireframe;
            }
        );
    }

    public preload() {
        return loadTexture("/assets/tileset.png").then(map => {
            this.level.setMaterial(map);
            this.tools.list.forEach(tool => tool.preload());
        });
    }

    public update(elapsed: number) {
        this.previusTime = this.elapsedTime;
        this.elapsedTime = elapsed;

        const delta = (this.elapsedTime - this.previusTime) * 0.001;
        this.toolSystem();
        this.historySystem();
        this.tileSlotSystem();
        this.movementSystem(delta);
        this.input.clear();

        this.renderer.render(this.scene, this.camera);
    }

    private movementSystem(dt: number) {
        // Mouse look
        const str = 0.0025;
        const dx = this.input.mouse.dx;
        const dy = this.input.mouse.dy;
        const rotation = this.camera.rotation.clone();
        rotation.y -= dx * str;
        rotation.x -= dy * str;
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
            .multiplyScalar(10)
            .multiplyScalar(dt);
        this.camera.position.add(velocity);
    }

    private toolSystem() {
        const { active } = this.tools;

        // Swap tools
        this.tools.list.forEach(tool => {
            if (this.input.isKeyPressed(tool.key)) {
                store.state.toolId = tool.name;
            }
        });

        if (this.input.isKeyPressed(KeyCode.TAB)) {
            let index = this.tools.list.indexOf(active);
            index += 1;
            index %= this.tools.list.length;

            const tool = this.tools.list[index];
            store.state.toolId = tool.name;
        }

        // Left mouse actions
        if (this.input.isMousePresed(MouseBtn.Left)) {
            active.onMousePressed();
        }

        if (this.input.isMouseReleased(MouseBtn.Left)) {
            active.onMouseReleased();
        }

        if (this.input.isMouseDown(MouseBtn.Left)) {
            active.onMouseMove();
        }

        // Right mouse actions
        if (this.input.isMousePresed(MouseBtn.Right)) {
            active.onRightMousePressed();
        }

        if (this.input.isMouseReleased(MouseBtn.Right)) {
            active.onRightMouseReleased();
        }

        if (this.input.isMouseDown(MouseBtn.Right)) {
            active.onRightMouseMove();
        }
    }

    private tileSlotSystem() {
        const KEY_NUM_1 = KeyCode.NUM_1 as number;
        for (let i = 0; i < 8; i++) {
            if (this.input.isKeyPressed(KEY_NUM_1 + i)) {
                store.state.textureSlotIndex = i;
                return;
            }
        }

        const scroll = this.input.mouse.scroll;
        if (scroll !== 0) {
            const offset = clamp(scroll * Number.MAX_SAFE_INTEGER, -1, 1);
            store.state.textureSlotIndex = modulo(
                store.state.textureSlotIndex + offset,
                store.state.textureSlots.length
            );
        }
    }

    private readonly history = {
        stack: new Array<string>(),
        index: 0,
        time: 0
    };
    private historySystem() {
        if (this.history.time !== this.level.updatedAt) {
            const json = JSON.stringify(this.level.data);
            this.history.stack[this.history.index] = json;
            this.history.stack.length = this.history.index + 1;

            this.history.time = this.level.updatedAt;
            this.history.index++;

            const MAX_HISTORY_STACK = 10;
            if (this.history.stack.length > MAX_HISTORY_STACK) {
                this.history.stack.shift();
                this.history.index = MAX_HISTORY_STACK;
            }
        }

        if (
            this.input.isKeyPressed(KeyCode.Z) &&
            this.input.isKeyDown(KeyCode.CTRL) &&
            this.history.index > 1
        ) {
            const json = this.history.stack[this.history.index - 2];
            this.level.data = JSON.parse(json);
            this.level.updateGeometry();

            this.history.time = this.level.updatedAt;
            this.history.index--;
        }

        if (
            this.input.isKeyPressed(KeyCode.Y) &&
            this.input.isKeyDown(KeyCode.CTRL) &&
            this.history.index < this.history.stack.length
        ) {
            const json = this.history.stack[this.history.index];
            this.level.data = JSON.parse(json);
            this.level.updateGeometry();

            this.history.time = this.level.updatedAt;
            this.history.index++;
        }
    }
}

export const editor = new Editor();
