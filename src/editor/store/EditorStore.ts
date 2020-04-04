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
import { Level, VoxelType } from "../Level";

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

    function sampleVoxel(level: Level, dir: -1 | 1) {
        const buffer: Intersection[] = [];
        const origin = new Vector2();
        raycaster.setFromCamera(origin, world.camera);
        raycaster.intersectObject(world.floor, true, buffer);
        raycaster.intersectObject(world.level, true, buffer);

        const [hit] = buffer;
        if (!hit) return;
        if (!hit.face) return;

        const point = hit.point.clone();
        const normal = hit.face.normal.clone().multiplyScalar(0.1 * dir);
        point.add(normal);

        const voxel = Level.getVoxel(level, point);
        if (voxel === undefined) {
            return;
        }

        return {
            point: point.clone(),
            normal: hit.face.normal.clone(),
            voxel,
        };
    }

    function updateMesh(ctx: StoreCtx) {
        console.log(`> Editor::build level mesh`);
        world.scene.remove(world.level);
        world.level = Level.createMesh(ctx.state.level, world.texture);
        world.scene.add(world.level);

        // Init lighting
        Level.setLighting(ctx.state.level, world.level);

        // Add light mesh
        {
            world.level.add(
                Level.createLightMesh(ctx.state.level, world.texture)
            );
        }

        // Add wireframe
        if (ctx.state.wireframe) {
            const material = new MeshBasicMaterial({
                wireframe: true,
                color: 0x00ff00,
            });
            world.level.add(new Mesh(world.level.geometry, material));
        }
    }

    const actions = {
        initLevel(
            ctx: StoreCtx,
            payload: { width: number; height: number; depth: number }
        ) {
            // Init new level data
            ctx.state.level = Level.create(
                payload.width,
                payload.height,
                payload.depth
            );

            Level.forEachVoxel(ctx.state.level, (voxel) => {
                if (voxel.y === 0) {
                    voxel.type = VoxelType.Solid;
                    voxel.faces.fill(8);
                }
            });

            // Reset world scene
            world.floor = createFloor(payload.width, payload.depth);
            world.level = Level.createMesh(ctx.state.level, world.texture);
            world.scene.remove(...world.scene.children);
            world.scene.add(world.floor, world.level);

            // Reset camera
            world.camera.rotation.set(Math.PI * -0.25, 0, 0, "YXZ");
            world.camera.position.set(
                payload.width / 2,
                payload.height / 2,
                payload.depth
            );
        },

        createFloor(ctx: StoreCtx, payload: { tileId: number }) {
            const { level } = ctx.state;
            Level.forEachVoxel(level, (voxel) => {
                if (voxel.y === 0) {
                    voxel.type = VoxelType.Solid;
                    voxel.faces.fill(payload.tileId);
                }
            });
            updateMesh(ctx);
        },

        placeVoxel(ctx: StoreCtx) {
            const tileId = ctx.getters.activeTileId;
            const rsp = sampleVoxel(ctx.state.level, 1);
            if (rsp !== undefined) {
                rsp.voxel.faces.fill(tileId);
                rsp.voxel.type =
                    tileId >= 8 ? VoxelType.Solid : VoxelType.Light;
                updateMesh(ctx);
            }
        },

        removeVoxel(ctx: StoreCtx) {
            const rsp = sampleVoxel(ctx.state.level, -1);
            if (rsp !== undefined) {
                rsp.voxel.type = VoxelType.Empty;
                updateMesh(ctx);
            }
        },

        sampleVoxel(ctx: StoreCtx) {
            const rsp = sampleVoxel(ctx.state.level, -1);
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
            const rsp = sampleVoxel(ctx.state.level, -1);
            if (rsp !== undefined) {
                rsp.voxel.faces.fill(ctx.getters.activeTileId);
                updateMesh(ctx);
            }
        },

        fillVoxelFace(ctx: StoreCtx) {
            const rsp = sampleVoxel(ctx.state.level, -1);
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
