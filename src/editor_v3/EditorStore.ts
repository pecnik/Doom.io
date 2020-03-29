import Vue from "vue";
import Vuex from "vuex";
import { Scene, PerspectiveCamera } from "three";

Vue.use(Vuex);

export class EditorState {
    // ...
}

export class EditorStore extends Vuex.Store<EditorState> {
    public readonly scene = new Scene();
    public readonly camera = new PerspectiveCamera(90);

    public constructor() {
        super({
            state: new EditorState()
        });
    }
}
