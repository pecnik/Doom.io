import Vue from "vue";
import Vuex, { ActionContext } from "vuex";
import {
    MeshBasicMaterial,
    PlaneGeometry,
    Mesh,
    Raycaster,
    Vector2,
    Intersection,
} from "three";
import { EditorWorld } from "./EditorWorld";
import { EditorState, EditorTool } from "./EditorState";
import { Level } from "../../game/data/Level";

Vue.use(Vuex);

export function createStore(world: EditorWorld) {
    type StoreCtx = ActionContext<EditorState, EditorState>;

    const raycaster = new Raycaster();

    function createFloor(width: number, depth: number) {
        const geo = new PlaneGeometry(width, depth, width, depth);
        const mat = new MeshBasicMaterial({
            wireframe: true,
            color: 0xf2f2f2,
        });
        geo.rotateX(-Math.PI / 2);
        geo.translate(-0.5, -0.5, -0.5);
        geo.translate(width / 2, 0, depth / 2);
        return new Mesh(geo, mat);
    }

    function sampleVoxel(dir: -1 | 1) {
        const buffer: Intersection[] = [];
        const origin = new Vector2();
        raycaster.setFromCamera(origin, world.camera);
        raycaster.intersectObject(world.floor, true, buffer);
        raycaster.intersectObject(world.level.mesh, true, buffer);

        const [hit] = buffer;
        if (!hit) return;
        if (!hit.face) return;

        const point = hit.point.clone();
        const normal = hit.face.normal.clone().multiplyScalar(0.5 * dir);
        point.add(normal);

        const voxel = world.level.getVoxelAt(point);
        if (voxel === undefined) return;
        return {
            point: point.clone(),
            normal: hit.face.normal.clone(),
            voxel,
        };
    }

    function updateMesh(ctx: StoreCtx) {
        console.log(`> Editor::build level mesh`);
        world.scene.remove(world.level.mesh);
        world.level.buildMesh();
        world.scene.add(world.level.mesh);

        // Add lighting
        world.level.addLighting();

        // Add light debug mesh
        if (ctx.state.debugLights) {
            world.level.addLightingDebug();
        }

        // Add wireframe
        if (ctx.state.wireframe) {
            world.level.addWireframe();
        }
    }

    const actions = {
        initLevel(
            ctx: StoreCtx,
            payload: { width: number; height: number; depth: number }
        ) {
            const { width, height, depth } = payload;

            world.level.resize(width, height, depth);
            world.level.forEachVoxel((voxel) => {
                if (voxel.y === 0) {
                    voxel.type = Level.VoxelType.Solid;
                    voxel.faces.fill(8);
                }
            });

            // Init new level data
            ctx.state.level = world.level.matrix;

            // Reset world scene
            world.scene.remove(...world.scene.children);

            world.floor = createFloor(payload.width, payload.depth);
            world.scene.add(world.floor);

            world.level.buildMesh();
            world.scene.add(world.level.mesh);

            // Reset camera
            world.camera.rotation.set(Math.PI * -0.25, 0, 0, "YXZ");
            world.camera.position.set(width / 2, height / 2, depth);

            updateMesh(ctx);
        },

        createFloor(ctx: StoreCtx, payload: { tileId: number }) {
            world.level.forEachVoxel((voxel) => {
                if (voxel.y === 0) {
                    voxel.type = Level.VoxelType.Solid;
                    voxel.faces.fill(payload.tileId);
                }
            });
            updateMesh(ctx);
        },

        placeVoxel(ctx: StoreCtx) {
            const tileId = ctx.getters.activeTileId;
            const rsp = sampleVoxel(1);
            if (rsp !== undefined) {
                rsp.voxel.faces.fill(tileId);
                if (tileId >= 8) {
                    rsp.voxel.type = Level.VoxelType.Solid;
                } else {
                    const lights = [0xffffff, 0xff0000, 0x00ff00, 0x0000ff];
                    rsp.voxel.type = Level.VoxelType.Light;
                    rsp.voxel.light = lights[tileId] || 0xffffff;
                }

                updateMesh(ctx);
            }
        },

        removeVoxel(ctx: StoreCtx) {
            const rsp = sampleVoxel(-1);
            if (rsp !== undefined) {
                rsp.voxel.type = Level.VoxelType.Empty;
                updateMesh(ctx);
            }
        },

        sampleVoxel(ctx: StoreCtx) {
            const rsp = sampleVoxel(-1);
            if (rsp !== undefined) {
                let face = -1;
                if (rsp.normal.x === -1) face = 0;
                if (rsp.normal.x === +1) face = 1;
                if (rsp.normal.y === -1) face = 2;
                if (rsp.normal.y === +1) face = 3;
                if (rsp.normal.z === -1) face = 4;
                if (rsp.normal.z === +1) face = 5;

                if (face > -1) {
                    const index = ctx.state.tileIdSlotIndex;
                    const tileId = rsp.voxel.faces[face];
                    ctx.dispatch("setTileIdSlot", { tileId, index });
                    ctx.dispatch("setTool", EditorTool.Paint);
                }
            }
        },

        fillVoxel(ctx: StoreCtx) {
            const rsp = sampleVoxel(-1);
            if (rsp !== undefined) {
                rsp.voxel.faces.fill(ctx.getters.activeTileId);
                updateMesh(ctx);
            }
        },

        fillVoxelFace(ctx: StoreCtx) {
            const rsp = sampleVoxel(-1);
            if (rsp !== undefined) {
                let index = -1;
                if (rsp.normal.x === -1) index = 0;
                if (rsp.normal.x === +1) index = 1;
                if (rsp.normal.y === -1) index = 2;
                if (rsp.normal.y === +1) index = 3;
                if (rsp.normal.z === -1) index = 4;
                if (rsp.normal.z === +1) index = 5;

                if (index > -1) {
                    rsp.voxel.faces[index] = ctx.getters.activeTileId;
                    updateMesh(ctx);
                }
            }
        },

        setWireframe(ctx: StoreCtx, enabled: boolean) {
            ctx.state.wireframe = enabled;
            updateMesh(ctx);
        },

        setDebugLights(ctx: StoreCtx, enabled: boolean) {
            ctx.state.debugLights = enabled;
            updateMesh(ctx);
        },

        setTool(ctx: StoreCtx, tool: EditorTool) {
            ctx.state.tool = tool;
        },

        setTileIdSlot(
            ctx: StoreCtx,
            payload: {
                index: number;
                tileId: number;
            }
        ) {
            const { index, tileId } = payload;
            Vue.set(ctx.state.tileIdSlotArray, index, tileId);
        },

        setTileIdSlotIndex(ctx: StoreCtx, tileIdSlotIndex: number) {
            ctx.state.tileIdSlotIndex = tileIdSlotIndex;
        },

        setTileSelectDialog(ctx: StoreCtx, open: boolean) {
            ctx.state.tileSelectDialog = open;
        },
    };

    return new Vuex.Store({
        state: new EditorState(),
        actions,
        getters: {
            activeTileId(state) {
                return state.tileIdSlotArray[state.tileIdSlotIndex];
            },
        },
    });
}
