import Vue from "vue";
import Vuetify from "vuetify";
import EditorApp from "./vue/Editor.vue";
import { Editor } from "./Editor";
import "vuetify/dist/vuetify.min.css";

Vue.use(Vuetify);

const vuetify = new Vuetify({
    theme: { dark: true },
});

new Vue({
    store: Editor.store,
    vuetify,
    render: (h) => h(EditorApp),
}).$mount("#ui-layer");

// Idk ...
const gamearea = document.getElementById("gamearea");
if (gamearea) {
    gamearea.remove();
}
