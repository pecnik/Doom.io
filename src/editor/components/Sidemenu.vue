<template>
    <div>
         <v-card color="teal" class="mb-4">
            <v-card-text>
                <sidemenu-settings></sidemenu-settings>
            </v-card-text>
        </v-card>

        <v-card color="teal" class="mb-4">
            <v-card-text>
                <sidemenu-tools></sidemenu-tools>
            </v-card-text>
        </v-card>

        <v-card color="teal" class="mb-4">
            <v-card-text>
                <sidemenu-texture></sidemenu-texture>
            </v-card-text>
        </v-card>
    </div>
</template>
<script>
import SidemenuTools from "./SidemenuTools.vue";
import SidemenuTexture from "./SidemenuTexture.vue";
import SidemenuSettings from "./SidemenuSettings.vue";
import { editor } from "../Editor";

export default {
    components: { SidemenuTools, SidemenuTexture, SidemenuSettings }
};
</script>