import Vue from "vue";
import Vuex from "vuex";
import {
    WebGLRenderer,
    PerspectiveCamera,
    Scene,
    Raycaster,
    Intersection,
    Vector2,
} from "three";
import { Level } from "./Level";
import { Input, MouseBtn } from "../game/core/Input";
import { ToolType, Tool } from "./tools/Tool";
import { BlockTool } from "./tools/BlockTool";
import { forEach, cloneDeep } from "lodash";
import { EraserTool } from "./tools/EraserTool";
import { PaintTool } from "./tools/PaintTool";
import { MoveTool } from "./tools/MoveTool";

Vue.use(Vuex);

export class Editor {
    public readonly raycaster = new Raycaster();
    public readonly renderer = new WebGLRenderer({ antialias: true });
    public readonly camera = new PerspectiveCamera(90);
    public readonly scene = new Scene();
    public readonly level = new Level();

    public readonly input = new Input({
        requestPointerLock: false,
        element: this.renderer.domElement,
    });

    public readonly store = new Vuex.Store({
        state: {
            cursor: { x: 0, y: 0 },
            defaultToolType: ToolType.Block,
            activeToolType: ToolType.Block,
            block: {
                brushSize: 1,
                tileId: 16,
            },
            eraser: {
                brushSize: 1,
            },
            paint: {
                tileId: 16,
            },
        },
        actions: {
            setActiveTool: (ctx, toolType: ToolType) => {
                if (this.store.state.activeToolType !== toolType) {
                    const prevType = this.store.state.activeToolType;
                    const prevTool = this.tools[prevType];
                    const nextNext = this.tools[toolType];
                    prevTool.end();
                    nextNext.start();
                    ctx.state.activeToolType = toolType;
                }
            },
        },
    });

    public readonly tools: Record<ToolType, Tool> = {
        [ToolType.Move]: new MoveTool(this),
        [ToolType.Block]: new BlockTool(this),
        [ToolType.Eraser]: new EraserTool(this),
        [ToolType.Paint]: new PaintTool(this),
    };

    public constructor() {
        this.camera.position.set(0, 10, 0);
        this.camera.rotation.set(-Math.PI / 2, 0, 0, "YXZ");
        this.renderer.setClearColor(0x35c8dc);
        this.level.loadMaterial();
        this.scene.add(this.level.mesh, this.level.floor, this.level.wireframe);
        this.setActiveTool(ToolType.Move);
    }

    public getActiveTool() {
        return this.tools[this.store.state.activeToolType];
    }

    public setActiveTool(toolType: ToolType) {
        this.store.dispatch("setActiveTool", toolType);
    }

    public sampleBlock(dir: -1 | 1) {
        const buffer: Intersection[] = [];
        const origin = new Vector2(
            this.store.state.cursor.x,
            this.store.state.cursor.y
        );
        this.raycaster.setFromCamera(origin, this.camera);
        this.raycaster.intersectObject(this.level.mesh, true, buffer);
        this.raycaster.intersectObject(this.level.floor, true, buffer);

        const [hit] = buffer;
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

    public resizeLevel(w: number, h: number, d: number) {
        const blocks = cloneDeep(this.level.blocks);
        this.level.resize(w, h, d);

        blocks.forEach((oldBlock) => {
            const newBlock = this.level.getBlockAt(oldBlock.origin);
            if (newBlock !== undefined) {
                newBlock.copy(oldBlock);
            }
        });

        this.level.updateGeometry();
    }

    public update() {
        this.getActiveTool().update();
        this.selectActiveTool();

        this.input.clear();
        this.renderer.render(this.scene, this.camera);
    }

    private selectActiveTool() {
        if (
            !this.input.isMouseDown(MouseBtn.Left) &&
            !this.input.isMouseDown(MouseBtn.Right)
        ) {
            const rsp = this.sampleBlock(1) || this.sampleBlock(-1);
            const { activeToolType, defaultToolType } = this.store.state;

            // The move tool should be active when the cursor is outside the level
            if (rsp === undefined && activeToolType !== ToolType.Move) {
                this.setActiveTool(ToolType.Move);
                return;
            }

            if (rsp !== undefined && activeToolType !== defaultToolType) {
                this.setActiveTool(defaultToolType);
                return;
            }
        }

        forEach(this.tools, (tool) => {
            const hotkey = this.input.isKeyDown(tool.hotkey);
            const active = tool === this.getActiveTool();
            if (!active && hotkey) {
                this.store.state.defaultToolType = tool.type;
            }
        });
    }
}

export const editor = new Editor();
