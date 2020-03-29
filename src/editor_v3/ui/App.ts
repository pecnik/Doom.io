import Vue from "vue";
import App from "./App.vue";

export function createUI() {
    return new Vue({
        render: h => h(App)
    }).$mount("#ui-layer");
}
