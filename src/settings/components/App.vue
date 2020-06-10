<template>
    <v-app>
        <v-container>
            <v-btn href="/" color="teal" class="mb-4">
                <v-icon>mdi-arrow-left</v-icon>
                <span>Back to menu</span>
            </v-btn>

            <v-tabs v-model="tab">
                <v-tab>Graphics</v-tab>
                <v-tab>Audio</v-tab>
                <v-tab>Input</v-tab>
                <v-tab>Profile</v-tab>
            </v-tabs>
            <v-tabs-items v-model="tab">
                <v-tab-item class="pa-8">
                    <graphics-settings></graphics-settings>
                </v-tab-item>
                <v-tab-item class="pa-8">
                    <audio-settings></audio-settings>
                </v-tab-item>
                <v-tab-item class="pa-8">
                    <input-settings></input-settings>
                </v-tab-item>
                <v-tab-item class="pa-8">
                    <profile-settings></profile-settings>
                </v-tab-item>
            </v-tabs-items>
        </v-container>
    </v-app>
</template>
<script>
import InputSettings from "./InputSettings.vue";
import AudioSettings from "./AudioSettings.vue";
import ProfileSettings from "./ProfileSettings.vue";
import GraphicsSettings from "./GraphicsSettings.vue";
export default {
    components: {
        GraphicsSettings,
        AudioSettings,
        InputSettings,
        ProfileSettings
    },
    data() {
        return { tab: 0 };
    }
};
</script>