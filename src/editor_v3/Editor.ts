import { Game } from "../game/core/Engine";
import { EditorHud } from "./EditorHud";
import { Input } from "../game/core/Input";
import { EditorStore } from "./EditorStore";
import Vue from "vue";
import App from "./vue/App.vue";

export class Editor implements Game {
    public readonly hud = new EditorHud();
    public readonly world = new EditorStore();
    public readonly input = new Input({
        requestPointerLock: true,
        element: document.getElementById("viewport") as HTMLElement
    });

    public readonly vue = new Vue({
        store: this.world,
        render: h => h(App)
    }).$mount("#ui-layer");

    public preload() {
        return Promise.all([
            // ...
        ]);
    }

    public create() {
        // ...
    }

    public update(_: number) {
        // ...
    }
}
