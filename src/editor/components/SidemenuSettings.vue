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
            <v-switch
                color="teal"
                label="Jump pads"
                v-model="view.jumpPads"
            ></v-switch>
            <v-switch
                color="teal"
                label="Fancy lighting"
                v-model="view.fancyLighting"
            ></v-switch>
        </v-card-text>
    </v-card>
</template>
<script>
import { editor } from "../Editor";

const applyViewSettings = view => {
    editor.level.wireframeMesh.visible = view.wireframe;
    editor.level.skyboxMesh.visible = view.skybox;
    editor.level.floorMesh.visible = view.floor;
    editor.level.lightMeshGroup.visible = view.lightOrbs;
    editor.level.jumpPadMeshGroup.visible = view.jumpPads;
    editor.store.state.fancyLighting = view.fancyLighting;

    view = JSON.stringify(view);
    localStorage.setItem("menu-viewport", view);
};

const json = localStorage.getItem("menu-viewport") || "{}";
const view = JSON.parse(json);
applyViewSettings(view);

export default {
    watch: {
        view: {
            deep: true,
            immediate: true,
            handler: applyViewSettings
        }
    },
    data() {
        return {
            view: {
                wireframe: true,
                skybox: true,
                floor: true,
                lightOrbs: true,
                jumpPads: true,
                fancyLighting: true,
                ...view
            }
        };
    }
};
</script>