import Vue from "vue";
import Vuetify from "vuetify";
import App from "./App.vue";
import { store } from "./Store";
import "vuetify/dist/vuetify.min.css";

Vue.use(Vuetify);

const vuetify = new Vuetify({
    theme: { dark: true }
});

new Vue({
    store,
    vuetify,
    render: h => h(App)
}).$mount("#ui-layer");

// Idk ...
const gamearea = document.getElementById("gamearea");
if (gamearea) {
    gamearea.remove();
}
