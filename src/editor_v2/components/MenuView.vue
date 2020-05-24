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
                editor.level.wireframe.visible = view.wireframe;
                editor.level.skybox.visible = view.skybox;
                editor.level.floor.visible = view.floor;
            }
        }
    },
    data() {
        return {
            view: {
                wireframe: true,
                skybox: true,
                floor: true
            }
        };
    }
};
</script>