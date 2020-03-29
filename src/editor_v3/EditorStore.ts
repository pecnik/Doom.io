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
import { createLevel, createLevelMesh, getVoxel } from "./EditorUtils";

Vue.use(Vuex);

export class EditorState {
    public level = createLevel(0, 0, 0);
}

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
        },

        placeVoxel(ctx: StoreCtx) {
            const tileId = 8; // TODO
            const rsp = sampleVoxel(ctx.state.level, 1);
            if (rsp !== undefined) {
                rsp.voxel.solid = true;
                rsp.voxel.faces.fill(tileId, 0, 6);
                buildLevelMesh(ctx.state.level);
            }
        }
    };

    return new Vuex.Store({
        state: new EditorState(),
        actions
    });
}
