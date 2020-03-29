import { Game } from "../game/core/Engine";
import {
    Scene,
    OrthographicCamera,
    Vector2,
    Vector3,
    Object3D,
    PlaneGeometry,
    MeshBasicMaterial,
    Mesh
} from "three";
import { EditorWorld } from "./data/EditorWorld";
import { Input, KeyCode, MouseBtn } from "../game/core/Input";
import { clamp } from "lodash";
import { modulo } from "../game/core/Utils";
import {
    loadTexture,
    setTextureUV,
    TILE_COLS,
    TILE_ROWS,
    buildLevelMesh
} from "./EditorUtils";
import { Tool } from "./tools/Tool";
import { BlockTool } from "./tools/BlockTool";
import { FillTool } from "./tools/FillTool";
import { EditorMenu } from "./data/EditorMenu";
import { EditorLevel } from "./data/EditorLevel";
import { SampleTool } from "./tools/SampleTool";

export const VIEW_WIDTH = 1920;
export const VIEW_HEIGHT = 1080;

export class Editor implements Game {
    public readonly input = new Input({ requestPointerLock: true });
    public readonly world = new EditorWorld();
    public readonly hud = {
        scene: new Scene(),
        cursor: new Object3D(),
        crosshair: new Object3D(),
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
    public readonly toolList = this.menu.addGroup();
    public readonly textureList = this.menu.addGroup();
    public readonly textureSlotsBar = this.menu.addGroup();

    public lastSave = 0;
    public isMenuOpen = false;

    public toolMap = {
        block: new BlockTool(this),
        fill: new FillTool(this),
        sample: new SampleTool(this)
    };

    public tools: Tool[] = Object.values(this.toolMap);
    public tool: Tool = this.toolMap.block;

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

            // // Load crosshair
            // loadTexture("/assets/sprites/crosshair.png").then(map => {
            //     const size = 128;
            //     const geo = new PlaneGeometry(size, size);
            //     const mat = new MeshBasicMaterial({
            //         map,
            //         blending: AdditiveBlending
            //     });
            //     const crosshair = new Mesh(geo, mat);
            //     crosshair.position.z = -1;
            //     this.hud.scene.add(crosshair);
            // }),

            // Load tool icon texture
            ...this.tools.map(tool => {
                return loadTexture(tool.icon).then(map => {
                    tool.iconTexture = map;
                });
            })
        ]);
    }

    public create(): void {
        this.menu.scene.position.z = -1;
        this.hud.scene.add(
            this.hud.crosshair,
            this.hud.cursor,
            this.menu.scene
        );
        this.initToolList();
        this.initTextureList();
        this.initTextureSlotsBar();
        this.toggleMenu(false);

        // Init crosshair
        this.tools.forEach(tool => {
            const map = tool.iconTexture;
            const geo = new PlaneGeometry(48, 48);
            const mat = new MeshBasicMaterial({
                map,
                transparent: true
            });
            const mesh = new Mesh(geo, mat);
            mesh.visible = false;
            this.hud.crosshair.add(mesh);
        });

        // Load from autosave
        const json = localStorage.getItem("auto-save");
        if (json !== null) {
            const data = JSON.parse(json);
            this.world.textureSlots = data.textureSlots as number[];
            this.world.textureSlotIndex = data.textureSlotIndex as number;

            const levelJson = data.level as EditorLevel;
            this.world.level.init(
                levelJson.width,
                levelJson.depth,
                levelJson.height
            );
            this.world.level.forEachVoxel(voxel => {
                const { x, y, z } = voxel.origin;
                const json = levelJson.voxel[x][y][z];
                voxel.solid = json.solid;
                Object.assign(voxel.origin, json.origin);
                Object.assign(voxel.faces, json.faces);
            });
            buildLevelMesh(this.world.level);

            console.log(`> Editor: load auto save`);
        }
    }

    private initToolList() {
        const size = 80;
        const padd = 32;
        const offsetx = size * 3;
        this.tools.forEach((tool, index) => {
            const map = tool.iconTexture;
            const geo = new PlaneGeometry(size, size);
            const mat = new MeshBasicMaterial({
                map,
                transparent: true
            });
            const mesh = new Mesh(geo, mat);
            mesh.position.x += size + padd - offsetx;
            mesh.position.x -= index * (size + padd);

            const onClick = () => {
                this.tool = tool;
            };

            const onUpdate = () => {
                if (this.tool !== tool) {
                    mesh.scale.setScalar(0.75);
                } else {
                    mesh.scale.setScalar(1);
                }
            };

            this.toolList.addButton({
                mesh,
                onClick,
                onUpdate
            });
        });
    }

    private initTextureList() {
        const size = 64;
        const padd = 0;
        const offsetx = -size * 2;
        const offsety = (size + padd) * TILE_ROWS * 0.5;
        for (let y = 0; y < TILE_ROWS; y++) {
            for (let x = 0; x < TILE_COLS; x++) {
                const state = {
                    tileId: this.textureList.buttons.length
                };

                const map = this.world.level.textrue;
                const geo = new PlaneGeometry(size, size);
                const mat = new MeshBasicMaterial({ map });
                const mesh = new Mesh(geo, mat);
                mesh.position.x += (size + padd) * x - offsetx;
                mesh.position.y -= (size + padd) * y - offsety;
                setTextureUV(geo, state.tileId);

                const mat2 = new MeshBasicMaterial({ color: 0x00ff55 });
                const outline = new Mesh(geo, mat2);
                outline.position.z = -0.1;
                outline.scale.setScalar(1.05);
                mesh.add(outline);

                const onClick = () => {
                    const index = this.world.textureSlotIndex;
                    this.world.textureSlots[index] = state.tileId;
                };

                const onUpdate = () => {
                    const index = this.world.textureSlotIndex;
                    const tileId = this.world.textureSlots[index];
                    if (state.tileId === tileId) {
                        mesh.scale.setScalar(1.2);
                        mesh.position.z = 1;
                    } else {
                        mesh.scale.setScalar(1);
                        mesh.position.z = 0.5;
                    }
                };

                this.textureList.addButton({
                    mesh,
                    onClick,
                    onUpdate
                });
            }
        }
    }

    private initTextureSlotsBar() {
        const slotCount = this.world.textureSlots.length;
        for (let index = 0; index < slotCount; index++) {
            const state = { tileId: -1 };

            const size = 128;
            const padd = 0;
            const offsetx = (size + padd) * slotCount * 0.5;
            const offsety = VIEW_HEIGHT / 2;

            const map = this.world.level.textrue;
            const geo = new PlaneGeometry(size, size);
            const mat = new MeshBasicMaterial({ map });
            const mesh = new Mesh(geo, mat);
            mesh.position.x += (size + padd) * index - offsetx;
            mesh.position.y += size - offsety;

            const outlineMat = new MeshBasicMaterial({
                color: 0x00ff55
            });
            const outline = new Mesh(geo, outlineMat);
            outline.position.z = -1;
            outline.scale.setScalar(1.05);
            mesh.add(outline);

            const onClick = () => {
                this.world.textureSlotIndex = index;
            };

            const onUpdate = () => {
                if (state.tileId !== this.world.textureSlots[index]) {
                    state.tileId = this.world.textureSlots[index];
                    setTextureUV(geo, state.tileId);
                }

                if (index !== this.world.textureSlotIndex) {
                    mesh.scale.setScalar(0.75);
                } else {
                    mesh.scale.setScalar(1);
                }
            };

            this.textureSlotsBar.addButton({
                mesh,
                onClick,
                onUpdate
            });
        }
    }

    // UPDATE LOOP
    // ======================================

    public update(dt: number) {
        this.world.elapsedTime += dt;

        if (this.input.isKeyPressed(KeyCode.TAB)) {
            this.toggleMenu(!this.isMenuOpen);
        }

        if (this.isMenuOpen) {
            this.updateMenu(dt);
        } else {
            this.updateEditor(dt);
        }

        // Crosshair
        for (let i = 0; i < this.tools.length; i++) {
            const tool = this.tools[i];
            const icon = this.hud.crosshair.children[i];
            icon.visible = tool === this.tool;
        }

        // Auto save
        const saveDelta = this.world.elapsedTime - this.lastSave;
        if (saveDelta > 5) {
            console.log(`> Editor: auto save`);
            this.lastSave = this.world.elapsedTime;

            const json = JSON.stringify({
                level: this.world.level,
                textureSlots: this.world.textureSlots,
                textureSlotIndex: this.world.textureSlotIndex
            });
            localStorage.setItem("auto-save", json);
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
        this.toolList.visible = value;
        this.textureList.visible = value;
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

        if (this.tool === this.toolMap.sample && mouse1) {
            this.tool = this.toolMap.fill;
        }

        if (this.input.isKeyPressed(KeyCode.ALT)) {
            this.tool = this.toolMap.sample;
        }

        if (this.input.isKeyPressed(KeyCode.Q)) {
            this.tool = this.toolMap.block;
        }

        if (this.input.isKeyPressed(KeyCode.E)) {
            this.tool = this.toolMap.fill;
        }
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
                this.world.textureSlotIndex = i;
                return;
            }
        }

        let { scroll } = this.input.mouse;
        if (scroll !== 0) {
            scroll *= Number.MAX_SAFE_INTEGER;
            scroll = clamp(scroll, -1, 1);
            this.world.textureSlotIndex = modulo(
                this.world.textureSlotIndex + scroll,
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
