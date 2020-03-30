import Vue from "vue";
import Vuex, { ActionContext } from "vuex";
import {
    MeshBasicMaterial,
    PlaneGeometry,
    Mesh,
    Raycaster,
    Vector2,
    Intersection
} from "three";
import { EditorWorld, LevelData } from "./EditorWorld";
import {
    createLevel,
    createLevelMesh,
    getVoxel,
    forEachVoxel
} from "../EditorUtils";
import { EditorState } from "./EditorState";

Vue.use(Vuex);

export function createStore(world: EditorWorld) {
    type StoreCtx = ActionContext<EditorState, EditorState>;

    const raycaster = new Raycaster();

    function createFloor(width: number, depth: number) {
        const geo = new PlaneGeometry(width, depth, width, depth);
        const mat = new MeshBasicMaterial({
            wireframe: true,
            color: 0xf2f2f2
        });
        geo.rotateX(-Math.PI / 2);
        geo.translate(-0.5, -0.5, -0.5);
        geo.translate(width / 2, 0, depth / 2);
        return new Mesh(geo, mat);
    }

    function sampleVoxel(level: LevelData, dir: -1 | 1) {
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

        const voxel = getVoxel(level, point);
        if (voxel === undefined) {
            return;
        }

        return {
            point: point.clone(),
            normal: hit.face.normal.clone(),
            voxel
        };
    }

    function buildLevelMesh(level: LevelData) {
        console.log(`> Editor::build level mesh`);
        world.scene.remove(world.level);
        world.level = createLevelMesh(level, world.texture);
        world.scene.add(world.level);
    }

    const actions = {
        initLevel(
            ctx: StoreCtx,
            payload: {
                width: number;
                height: number;
                depth: number;
            }
        ) {
            // Init new level data
            ctx.state.level = createLevel(
                payload.width,
                payload.height,
                payload.depth
            );

            // Reset world scene
            world.floor = createFloor(payload.width, payload.depth);
            world.level = createLevelMesh(ctx.state.level, world.texture);
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
            forEachVoxel(level, voxel => {
                if (voxel.y === 0) {
                    voxel.solid = true;
                    voxel.faces.fill(payload.tileId);
                }
            });
            buildLevelMesh(level);
        },

        placeVoxel(ctx: StoreCtx) {
            const tileId = ctx.getters.activeTileId;
            const rsp = sampleVoxel(ctx.state.level, 1);
            if (rsp !== undefined) {
                rsp.voxel.solid = true;
                rsp.voxel.faces.fill(tileId);
                buildLevelMesh(ctx.state.level);
            }
        },

        removeVoxel(ctx: StoreCtx) {
            const rsp = sampleVoxel(ctx.state.level, -1);
            if (rsp !== undefined) {
                rsp.voxel.solid = false;
                buildLevelMesh(ctx.state.level);
            }
        },

        setTileIdSlotIndex(ctx: StoreCtx, tileIdSlotIndex: number) {
            ctx.state.tileIdSlotIndex = tileIdSlotIndex;
        }
    };

    return new Vuex.Store({
        state: new EditorState(),
        actions,
        getters: {
            activeTileId(state) {
                return state.tileIdSlotArray[state.tileIdSlotIndex];
            }
        }
    });
}
