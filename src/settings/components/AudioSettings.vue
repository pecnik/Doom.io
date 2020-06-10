<template>
    <div>
        <v-card-subtitle>Audio</v-card-subtitle>
        <v-card-text>
            <v-slider
                label="Master volume"
                v-model="settings.masterVolume"
                min="0"
                max="1"
                step="0.05"
                thumb-label
            ></v-slider>
        </v-card-text>
        <save-settings
            @save="save"
            @reset="reset"
            :settings="settings"
        ></save-settings>
    </div>
</template>
<script>
import SaveSettings from "./SaveSettings.vue";
import { AudioSettings, Settings, saveSettings } from "../Settings";
export default {
    components: { SaveSettings },
    methods: {
        reset() {
            this.settings = new AudioSettings();
            saveSettings(Settings);
        },
        save() {
            Settings.audio = this.settings;
            saveSettings(Settings);
        }
    },
    data() {
        const settings = new AudioSettings();
        Object.assign(settings, Settings.audio);
        return { settings };
    }
};
</script>