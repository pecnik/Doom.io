import Vue from "vue";
import Vuex from "vuex";
import {
    WebGLRenderer,
    PerspectiveCamera,
    Scene,
    Raycaster,
    Intersection,
    Object3D,
} from "three";
import { Level } from "./Level";
import { Input, KeyCode, MouseBtn } from "../game/core/Input";
import { History } from "./History";
import { BlockState } from "./tools/BlockState";
import { ToolState } from "./tools/ToolState";
import { BlockDrawState } from "./tools/BlockDrawState";
import { MoveState } from "./tools/MoveState";
import { BlockEraseState } from "./tools/BlockEraseState";
import { PaintState } from "./tools/PaintState";
import { SampleState } from "./tools/SampleState";
import { SelectState } from "./tools/SelectState";

Vue.use(Vuex);

export class Editor {
    public readonly raycaster = new Raycaster();
    public readonly renderer = new WebGLRenderer({ antialias: true });
    public readonly camera = new PerspectiveCamera(60);
    public readonly scene = new Scene();
    public readonly level = new Level();
    public readonly history = new History();

    private toolMap: Map<string, ToolState> = new Map();
    private tool: ToolState;

    public readonly input = new Input({
        requestPointerLock: false,
        element: this.renderer.domElement,
    });

    public readonly store = new Vuex.Store({
        state: {
            levelMutations: 0,
            cursor: { x: 0, y: 0 },
            cursorType: "",
            defaultTool: "block",
            tileId: 16,
            brushSize: 1,
            blockIndex: -1,
        },
    });

    public constructor() {
        this.level.resize(16, 16, 16);
        this.level.loadSkybox();
        this.level.loadMaterial();
        this.level.updateGeometry();
        this.scene.add(
            this.level.mesh,
            this.level.skybox,
            this.level.floor,
            this.level.wireframe
        );

        this.commitLevelMutation((level) => {
            level.blocks.forEach((block) => {
                block.solid = block.origin.y === 0;
            });
        });

        this.camera.position.set(0, 10, 0);
        this.camera.rotation.set(-Math.PI / 2, 0, 0, "YXZ");

        this.renderer.setClearColor(0x35c8dc);

        // Initalize all tools
        this.getTool(MoveState);
        this.getTool(BlockState);
        this.getTool(BlockDrawState);
        this.getTool(BlockEraseState);
        this.getTool(PaintState);
        this.getTool(SampleState);

        this.tool = this.getTool(BlockState);
        this.tool.start(this.tool);

        this.store.watch(
            (state) => state.defaultTool,
            () => this.setToolStateDefault()
        );
    }

    public update() {
        this.updateTools();
        this.updateDistory();
        this.input.clear();
        this.renderer.render(this.scene, this.camera);
    }

    private updateTools() {
        if (this.input.isKeyPressed(KeyCode.B)) {
            this.tool.hotkeyBlock();
        }

        if (this.input.isKeyPressed(KeyCode.F)) {
            this.tool.hotkeyPaint();
        }

        if (this.input.isKeyPressed(KeyCode.G)) {
            this.tool.hotkeySelect();
        }

        if (this.input.isKeyDown(KeyCode.SPACE)) {
            this.tool.startMove();
        }

        if (this.input.isKeyReleased(KeyCode.SPACE)) {
            this.tool.endMove();
        }

        if (this.input.isKeyPressed(KeyCode.S)) {
            this.tool.startSample();
        }

        if (this.input.isKeyReleased(KeyCode.S)) {
            this.tool.endSample();
        }

        if (this.input.isMousePresed(MouseBtn.Left)) {
            this.tool.startAction1();
        }

        if (this.input.isMousePresed(MouseBtn.Right)) {
            this.tool.startAction2();
        }

        if (
            this.input.isMouseReleased(MouseBtn.Left) ||
            this.input.isMouseReleased(MouseBtn.Right)
        ) {
            this.tool.endAction();
        }

        this.tool.update();
    }

    private updateDistory() {
        if (this.input.isKeyDown(KeyCode.CTRL)) {
            if (this.input.isKeyPressed(KeyCode.Z)) {
                const json = this.history.undo();
                if (json !== undefined) {
                    this.level.readJson(json);
                    this.level.updateGeometry();
                }
            }
            if (this.input.isKeyPressed(KeyCode.Y)) {
                const json = this.history.redo();
                if (json !== undefined) {
                    this.level.readJson(json);
                    this.level.updateGeometry();
                }
            }
        }
    }

    public commitLevelMutation(mutation: (level: Level) => void) {
        mutation(this.level);
        this.level.updateGeometry();
        this.level.updateGeometryShading();
        this.history.push(this.level.toJSON());
        this.store.state.levelMutations++;
    }

    //#region Tools

    private getTool<T extends ToolState>(Tool: new (e: Editor) => T): T {
        const tool = this.toolMap.get(Tool.name);
        if (tool instanceof Tool) {
            return tool;
        }
        const newTool = new Tool(this);
        newTool.initialize();
        this.toolMap.set(Tool.name, newTool);
        return newTool;
    }

    public setToolStateDefault() {
        if (this.store.state.defaultTool === "block") {
            return this.setToolState(BlockState);
        }

        if (this.store.state.defaultTool === "paint") {
            return this.setToolState(PaintState);
        }

        if (this.store.state.defaultTool === "select") {
            return this.setToolState(SelectState);
        }

        return this.setToolState(BlockState);
    }

    public setToolState<T extends ToolState>(Tool: new (e: Editor) => T): T {
        const tool = this.getTool(Tool);
        if (tool === this.tool) return tool;

        const prevTool = this.tool;
        const nextTool = tool;
        prevTool.end(nextTool);
        nextTool.start(prevTool);
        this.tool = nextTool;
        this.store.state.cursorType = nextTool.cursorType;
        return nextTool;
    }

    //#endregion

    //#region Utils

    public hitscan(scene?: Object3D) {
        const buffer: Intersection[] = [];
        this.raycaster.setFromCamera(this.store.state.cursor, this.camera);
        if (scene !== undefined) {
            this.raycaster.intersectObject(scene, true, buffer);
            return buffer;
        }

        this.raycaster.intersectObject(this.level.mesh, true, buffer);
        this.raycaster.intersectObject(this.level.floor, true, buffer);
        return buffer;
    }

    public sampleBlock(dir: -1 | 1) {
        const [hit] = this.hitscan();
        if (!hit) return;
        if (!hit.face) return;

        const point = hit.point.clone();
        const normal = hit.face.normal.clone().multiplyScalar(0.5 * dir);
        point.add(normal);

        const block = this.level.getBlockAt(point);
        if (block === undefined) return;

        return {
            block,
            point: point.clone(),
            normal: hit.face.normal.clone(),
        };
    }

    //#endregion
}

export const editor = new Editor();
