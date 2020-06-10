import Vue from "vue";
import Vuetify from "vuetify";
import App from "./components/App.vue";
import "vuetify/dist/vuetify.min.css";

Vue.use(Vuetify);

const vuetify = new Vuetify({
    theme: { dark: true },
});

new Vue({
    vuetify,
    render: (h) => h(App),
}).$mount("#vue-app-mount");
