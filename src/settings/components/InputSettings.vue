<template>
    <div>
        <v-card-subtitle>Mouse</v-card-subtitle>
        <v-card-text>
            <v-slider
                label="Sensitivity"
                v-model="settings.mouseSensitivity"
                min="0.1"
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
import { InputSettings, Settings, saveSettings } from "../Settings";
export default {
    components: { SaveSettings },
    methods: {
        reset() {
            this.settings = new InputSettings();
            saveSettings(Settings);
        },
        save() {
            Settings.input = this.settings;
            saveSettings(Settings);
        }
    },
    data() {
        const settings = new InputSettings();
        Object.assign(settings, Settings.input);
        return { settings };
    }
};
</script>