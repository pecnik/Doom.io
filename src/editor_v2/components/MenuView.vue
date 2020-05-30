<template>
    <v-card>
        <v-card-title>Viewport</v-card-title>
        <v-card-text>
            <v-switch
                color="teal"
                label="Wireframe"
                v-model="view.wireframe"
            ></v-switch>
            <v-switch
                color="teal"
                label="Skybox"
                v-model="view.skybox"
            ></v-switch>
            <v-switch
                color="teal"
                label="Floor grid"
                v-model="view.floor"
            ></v-switch>
            <v-switch
                color="teal"
                label="Light orbs"
                v-model="view.lightOrbs"
            ></v-switch>
        </v-card-text>
    </v-card>
</template>
<script>
import { editor } from "../Editor";
export default {
    watch: {
        view: {
            deep: true,
            immediate: true,
            handler(view) {
                editor.level.wireframeMesh.visible = view.wireframe;
                editor.level.skyboxMesh.visible = view.skybox;
                editor.level.lightsMesh.visible = view.lightOrbs;
                editor.level.floorMesh.visible = view.floor;

                view = JSON.stringify(view);
                localStorage.setItem("menu-viewport", view);
            }
        }
    },
    data() {
        const json = localStorage.getItem("menu-viewport") || "{}";
        const view = JSON.parse(json);
        return {
            view: {
                wireframe: true,
                skybox: true,
                floor: true,
                lightOrbs: true,
                ...view
            }
        };
    }
};
</script>