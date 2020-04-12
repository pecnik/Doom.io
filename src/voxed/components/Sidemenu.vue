<template>
    <div>
        <v-tabs v-model="tab">
            <v-tab key="tools">Tools</v-tab>
            <v-tab key="settings">Settings</v-tab>
        </v-tabs>
        <v-tabs-items v-model="tab">
            <v-tab-item key="0">
                <v-card>
                    <v-card-text>
                        <div>Brush</div>
                        <sidemenu-block></sidemenu-block>
                    </v-card-text>
                    <v-card-text>
                        <div>Texture</div>
                        <sidemenu-texture></sidemenu-texture>
                    </v-card-text>
                </v-card>
            </v-tab-item>
             <v-tab-item key="1">
                <v-card flat>
                    <v-card-text>
                        <sidemenu-settings></sidemenu-settings>
                    </v-card-text>
                </v-card>
            </v-tab-item>
        </v-tabs-items>
    </div>
</template>
<script>
import SidemenuBlock from "./SidemenuBlock.vue";
import SidemenuTexture from "./SidemenuTexture.vue";
import SidemenuSettings from "./SidemenuSettings.vue";
export default {
    components: {
        SidemenuBlock,
        SidemenuTexture,
        SidemenuSettings
    },
    data() {
        return {
            tab: ""
        };
    }
};
</script>