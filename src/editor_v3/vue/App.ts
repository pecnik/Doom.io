import Vue from "vue";
import App from "./App.vue";
import { EditorStore } from "../EditorStore";

export function createVueUi(store: EditorStore) {
    return new Vue({
        store,
        render: h => h(App)
    }).$mount("#ui-layer");
}
