import Vue from "vue";
import Vuex, { ActionContext } from "vuex";
import {
    Scene,
    PerspectiveCamera,
    MeshBasicMaterial,
    PlaneGeometry,
    Mesh
} from "three";

Vue.use(Vuex);

export class EditorState {
    public readonly level = {
        width: 0,
        height: 0,
        depth: 0
    };
}

export class EditorWorld {
    public elapsedTime = 0;
    public readonly scene = new Scene();
    public readonly camera = new PerspectiveCamera(90);
}

export function createStore(world: EditorWorld) {
    type StoreCtx = ActionContext<EditorState, EditorState>;

    const actions = {
        initLevel(
            ctx: StoreCtx,
            payload: {
                width: number;
                height: number;
                depth: number;
            }
        ) {
            // Set dimations
            ctx.state.level.width = payload.width;
            ctx.state.level.height = payload.height;
            ctx.state.level.depth = payload.depth;

            // Reset world
            world.scene.remove(...world.scene.children);

            // Create world
            const floor = (() => {
                const mat = new MeshBasicMaterial({
                    wireframe: true,
                    color: 0xf2f2f2
                });

                const geo = new PlaneGeometry(
                    payload.width,
                    payload.depth,
                    payload.width,
                    payload.depth
                );

                geo.rotateX(-Math.PI / 2);
                geo.translate(-0.5, -0.5, -0.5);
                geo.translate(payload.width / 2, 0, payload.depth / 2);
                return new Mesh(geo, mat);
            })();

            // Reset camera
            world.camera.position.set(
                payload.width / 2,
                payload.height / 2,
                payload.depth
            );
            world.camera.rotation.set(Math.PI * -0.25, 0, 0, "YXZ");

            world.scene.add(floor);
        }
    };

    return new Vuex.Store({
        state: new EditorState(),
        actions
    });
}
