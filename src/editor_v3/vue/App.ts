import Vue from "vue";
import App from "./App.vue";
import { Store } from "vuex";
import { EditorState } from "../store/EditorStore";

export function createVueUi(store: Store<EditorState>) {
    return new Vue({
        store,
        render: h => h(App)
    }).$mount("#ui-layer");
}
