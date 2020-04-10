import Vue from "vue";
import Vuex from "vuex";
import { WebGLRenderer, Scene, PerspectiveCamera } from "three";
import { Input } from "../game/core/Input";

Vue.use(Vuex);

export class Editor {
    public static readonly getInstance = (() => {
        const intance = new Editor();
        return () => intance;
    })();

    public elapsedTime = 0;
    public previusTime = 0;

    public readonly renderer = new WebGLRenderer({});
    public readonly camera = new PerspectiveCamera(90);
    public readonly scene = new Scene();

    public readonly input = new Input({
        requestPointerLock: true,
        element: this.renderer.domElement
    });

    public readonly store = new Vuex.Store({
        state: {
            texture: {
                slots: [0, 1, 2, 3, 8, 9, 10, 11],
                index: 0
            }
        },
        actions: {}
    });

    public update(elapsed: number) {
        this.previusTime = this.elapsedTime;
        this.elapsedTime = elapsed;

        const delta = this.elapsedTime - this.previusTime;
        delta; // ..

        this.renderer.render(this.scene, this.camera);
    }
}
