<template>
    <div>
        <v-card-subtitle>Display name</v-card-subtitle>
        <v-card-text>
            <v-text-field v-model="settings.displayName"></v-text-field>
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
import { ProfileSettings, Settings, saveSettings } from "../Settings";
export default {
    components: { SaveSettings },
    methods: {
        reset() {
            this.settings = new ProfileSettings();
            saveSettings(Settings);
        },
        save() {
            Settings.profile = this.settings;
            saveSettings(Settings);
        }
    },
    data() {
        const settings = new ProfileSettings();
        Object.assign(settings, Settings.profile);
        return { settings };
    }
};
</script>