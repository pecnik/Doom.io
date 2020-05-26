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
import { Level, LevelJSON } from "./Level";
import { Input, MouseBtn, KeyCode } from "../game/core/Input";
import { ToolType, Tool } from "./tools/Tool";
import { BlockTool } from "./tools/BlockTool";
import { forEach, cloneDeep } from "lodash";
import { PaintTool } from "./tools/PaintTool";
import { MoveTool } from "./tools/MoveTool";
import { LightTool } from "./tools/LightTool";
import { BounceTool } from "./tools/BounceTool";
import { History } from "./History";

Vue.use(Vuex);

const STORAGE_KEY = "editor-level";

export class Editor {
    public readonly raycaster = new Raycaster();
    public readonly renderer = new WebGLRenderer({ antialias: true });
    public readonly camera = new PerspectiveCamera(60);
    public readonly scene = new Scene();
    public readonly history = new History();

    public readonly level = this.initLevel();

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
            paint: {
                tileId: 16,
            },
            light: {
                rgba: { r: 255, g: 255, b: 255, a: 1 },
            },
            bounce: {
                blockIndex: -1,
                bounceValue: 0,
            },
        },
        actions: {
            setActiveTool: (ctx, toolType: ToolType) => {
                if (this.store.state.activeToolType !== toolType) {
                    const prevType = this.store.state.activeToolType;
                    const prevTool = this.tools[prevType];
                    const nextNext = this.tools[toolType];
                    prevTool.end(toolType);
                    nextNext.start(prevType);
                    ctx.state.activeToolType = toolType;
                }
            },
        },
    });

    public readonly tools: Record<ToolType, Tool> = {
        [ToolType.Move]: new MoveTool(this),
        [ToolType.Block]: new BlockTool(this),
        [ToolType.Paint]: new PaintTool(this),
        [ToolType.Light]: new LightTool(this),
        [ToolType.Bounce]: new BounceTool(this),
    };

    public constructor() {
        this.commitChange();
        this.level.loadSkybox();
        this.level.loadMaterial();
        this.scene.add(
            this.level.mesh,
            this.level.skybox,
            this.level.floor,
            this.level.wireframe
        );

        this.camera.position.set(0, 10, 0);
        this.camera.rotation.set(-Math.PI / 2, 0, 0, "YXZ");

        this.renderer.setClearColor(0x35c8dc);

        // Init all tools
        forEach(this.tools, (tool) => this.setActiveTool(tool.type));
        this.setActiveTool(ToolType.Block);
    }

    private initLevel(): Level {
        const level = new Level();

        const json = localStorage.getItem(STORAGE_KEY);
        if (json !== null) {
            const jsonLevel = JSON.parse(json) as LevelJSON;
            level.readJson(jsonLevel);
        } else {
            level.resize(16, 16, 16);
            level.blocks.forEach((block) => {
                block.solid = block.origin.y === 0;
            });
        }

        level.updateGeometry();
        return level;
    }

    public getActiveTool() {
        return this.tools[this.store.state.activeToolType];
    }

    public setActiveTool(toolType: ToolType) {
        this.store.dispatch("setActiveTool", toolType);
    }

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
        this.commitChange();
    }

    public createLevelFloor(height: number, tileId: number) {
        for (let x = 0; x < this.level.width; x++) {
            for (let z = 0; z < this.level.depth; z++) {
                for (let y = 0; y < height; y++) {
                    const block = this.level.getBlock(x, y, z);
                    if (block !== undefined) {
                        block.solid = true;
                        block.faces.fill(tileId);
                    }
                }
            }
        }

        this.level.updateGeometry();
        this.commitChange();
    }

    public commitChange() {
        console.log(`> Editor::change`);
        const json = this.level.toJSON();
        this.history.push(json);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(json));
    }

    public update() {
        this.getActiveTool().update();
        this.selectActiveTool();

        if (this.input.isKeyDown(KeyCode.CTRL)) {
            const apply = (json: LevelJSON) => {
                const { activeToolType } = this.store.state;
                this.level.readJson(json);
                forEach(this.tools, (tool) => {
                    this.setActiveTool(tool.type);
                });
                this.setActiveTool(activeToolType);
            };

            if (this.input.isKeyPressed(KeyCode.Z)) {
                const json = this.history.undo();
                if (json !== undefined) {
                    apply(json);
                }
            }

            if (this.input.isKeyPressed(KeyCode.Y)) {
                const json = this.history.redo();
                if (json !== undefined) {
                    apply(json);
                }
            }
        }

        this.input.clear();
        this.renderer.render(this.scene, this.camera);
    }

    private selectActiveTool() {
        if (this.input.isKeyDown(KeyCode.SPACE)) {
            this.setActiveTool(ToolType.Move);
            return;
        }

        if (this.input.isKeyReleased(KeyCode.SPACE)) {
            this.setActiveTool(this.store.state.defaultToolType);
            return;
        }

        if (
            !this.input.isMouseDown(MouseBtn.Left) &&
            !this.input.isMouseDown(MouseBtn.Right)
        ) {
            const rsp = this.sampleBlock(1) || this.sampleBlock(-1);
            const { activeToolType, defaultToolType } = this.store.state;
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
