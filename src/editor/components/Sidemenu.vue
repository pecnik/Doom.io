<template>
    <div>
        <div class="mb-4">
            <sidemenu-file></sidemenu-file>
            <sidemenu-edit></sidemenu-edit>
        </div>
        <v-card>
            <v-tabs v-model="tab">
                <v-tab>
                    <v-icon>mdi-pencil</v-icon>
                </v-tab>
                <v-tab>
                    <v-icon>mdi-settings</v-icon>
                </v-tab>
                <v-tab>
                    <v-icon>mdi-image</v-icon>
                </v-tab>
            </v-tabs>
            <v-tabs-items v-model="tab">
                <v-tab-item>
                    <v-card-text>
                        <sidemenu-tools></sidemenu-tools>
                    </v-card-text>
                </v-tab-item>
                <v-tab-item>
                    <sidemenu-settings></sidemenu-settings>
                </v-tab-item>
                <v-tab-item>
                    <sidemenu-textures></sidemenu-textures>
                </v-tab-item>
            </v-tabs-items>
        </v-card>
    </div>
</template>
<script>
import SidemenuFile from "./SidemenuFile.vue";
import SidemenuEdit from "./SidemenuEdit.vue";
import SidemenuTools from "./SidemenuTools.vue";
import SidemenuTextures from "./SidemenuTextures.vue";
import SidemenuSettings from "./SidemenuSettings.vue";
export default {
    components: {
        SidemenuFile,
        SidemenuEdit,
        SidemenuTools,
        SidemenuTextures,
        SidemenuSettings
    },
    data() {
        return { tab: 0 };
    }
};
</script>