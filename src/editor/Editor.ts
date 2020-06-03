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
import { Input, KeyCode } from "../game/core/Input";
import { History } from "./History";
import { Tool } from "./tools/Tool";
import { BlockTool } from "./tools/BlockTool";
import { MoveTool } from "./tools/MoveTool";
import { EraserTool } from "./tools/EraserTool";
import { PaintTool } from "./tools/PaintTool";
import { SelecTool } from "./tools/SelectTool";
import { SampleTool } from "./tools/SampleTool";

Vue.use(Vuex);

export class Editor {
    public readonly raycaster = new Raycaster();
    public readonly renderer = new WebGLRenderer({ antialias: true });
    public readonly camera = new PerspectiveCamera(60);
    public readonly scene = new Scene();
    public readonly level = new Level();
    public readonly history = new History();

    public readonly input = new Input({
        requestPointerLock: false,
        element: this.renderer.domElement,
    });

    public readonly store = new Vuex.Store({
        state: {
            levelMutations: 0,
            cursor: { x: 0, y: 0 },
            cursorType: "",
            activeTool: "",
            tileId: 16,
            brushSize: 1,
            blockIndex: -1,
            fancyLighting: true,
        },
    });

    public readonly tools = this.createTools();

    public constructor() {
        this.level.loadSkybox();
        this.level.loadMaterial();
        this.level.updateGeometry();
        this.scene.add(
            this.level.mesh,
            this.level.skyboxMesh,
            this.level.floorMesh,
            this.level.lightMeshGroup,
            this.level.jumpPadMeshGroup,
            this.level.wireframeMesh
        );

        this.commitLevelMutation((level) => {
            const json = localStorage.getItem("level");
            if (json) {
                level.readJson(JSON.parse(json));
            } else {
                level.resize(16, 16, 16);
                level.blocks.forEach((block) => {
                    block.solid = block.origin.y === 0;
                });
            }
        });

        this.camera.position.set(0, 10, 0);
        this.camera.rotation.set(-Math.PI / 2, 0, 0, "YXZ");

        this.renderer.setClearColor(0x35c8dc);

        this.store.watch(
            (state) => state.fancyLighting,
            () => this.updateLevelMesh()
        );
    }

    private createTools() {
        type ToolClass<T extends Tool> = new (e: Editor) => T;

        const tools = {
            all: new Array<Tool>(),
            active: new Tool(this),

            setActive: <T extends Tool>(TCls: ToolClass<T> | Tool) => {
                const nextTool = TCls instanceof Tool ? TCls : tools.get(TCls);
                const prevTool = tools.active;
                if (nextTool !== prevTool) {
                    prevTool.end();
                    nextTool.start();
                    tools.active = nextTool;
                    this.store.state.activeTool = nextTool.name;
                }
            },

            get: <T extends Tool>(TCls: ToolClass<T>): T => {
                for (let i = 0; i < tools.all.length; i++) {
                    const tool = tools.all[i];
                    if (tool instanceof TCls) {
                        return tool;
                    }
                }

                const tool = new TCls(this);
                tool.initialize();
                tools.all.push(tool);
                return tool;
            },
        };

        this.store.watch(
            (state) => state.activeTool,
            (activeTool) => {
                const tool = tools.all.find((t) => t.name === activeTool);
                if (tool !== undefined) {
                    tools.setActive(tool);
                }
            }
        );

        // Initialize all tools
        tools.get(MoveTool);
        tools.get(BlockTool);
        tools.get(EraserTool);
        tools.get(PaintTool);
        tools.get(SelecTool);
        tools.get(SampleTool);
        tools.all.forEach((tool) => tool.end());

        // Select move as default tool
        this.store.state.activeTool = tools.get(MoveTool).name;

        return tools;
    }

    public update() {
        this.updateTools();
        this.updateHistory();
        this.input.clear();
        this.renderer.render(this.scene, this.camera);
    }

    private prevTool = this.tools.active;
    private currTool = this.tools.active;
    private updateTools() {
        this.tools.all.forEach((tool) => {
            if (tool.hotkey && this.input.isKeyPressed(tool.hotkey)) {
                this.tools.setActive(tool);
            }
        });

        this.currTool = this.tools.active.getModifiedTool();
        if (this.prevTool !== this.currTool) {
            this.prevTool.end();
            this.currTool.start();
            this.prevTool = this.currTool;
            this.store.state.cursorType = this.currTool.cursorType;
        }

        if (this.input.isAnyMousePresed()) {
            this.currTool.onPresed();
        }

        if (this.input.isAnyMousReleased()) {
            this.currTool.onReleased();
        }

        if (this.input.isAnyMouseDown()) {
            this.currTool.onDown();
        } else {
            this.currTool.onUp();
        }

        this.currTool.update();
    }

    private updateHistory() {
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
        this.updateLevelMesh();
        this.history.push(this.level.toJson());
        this.store.state.levelMutations++;
    }

    private updateLevelMesh() {
        this.level.updateGeometry();
        if (this.store.state.fancyLighting) {
            this.level.updateGeometryLightning().then(() => {
                this.level.updateAmbientOcclusion();
            });
        }
    }

    // Utils

    public hitscan(scene?: Object3D) {
        const buffer: Intersection[] = [];
        this.raycaster.setFromCamera(this.store.state.cursor, this.camera);
        if (scene !== undefined) {
            this.raycaster.intersectObject(scene, true, buffer);
            return buffer;
        }

        this.raycaster.intersectObject(this.level.mesh, true, buffer);
        this.raycaster.intersectObject(this.level.floorMesh, true, buffer);
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
        this.commitLevelMutation((level) => {
            const blocks = [...level.blocks];
            level.resize(w, h, d);
            blocks.forEach((prevBlock) => {
                const currBlock = level.getBlockAt(prevBlock.origin);
                if (currBlock !== undefined) {
                    currBlock.copy(prevBlock);
                }
            });
        });
    }
}

export const editor = new Editor();
