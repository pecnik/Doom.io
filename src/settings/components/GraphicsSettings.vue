<template>
    <div>
        <v-card-subtitle>Performance</v-card-subtitle>
        <v-card-text>
            <v-switch label="FPS Meter" v-model="settings.fpsMeter"></v-switch>
        </v-card-text>

        <v-divider vertical></v-divider>

        <v-card-subtitle>Rendering</v-card-subtitle>
        <v-card-text>
            <v-switch
                v-model="settings.antialiasing"
                label="Antialiasing"
            ></v-switch>
            <v-slider
                label="Render resolution"
                v-model="settings.renderResolution"
                min="0.5"
                max="1"
                step="0.25"
                thumb-label
            ></v-slider>
        </v-card-text>

        <v-divider vertical></v-divider>

        <v-card-subtitle>Tone mapping</v-card-subtitle>
        <v-card-text>
            <v-select
                v-model="settings.toneMap"
                label="Tone mapping"
                solo
                :items="toneMapItems"
            ></v-select>
            <v-slider
                v-if="settings.toneMap > 0"
                v-model="settings.toneMapExposure"
                label="Exposure"
                min="0.1"
                max="2"
                step="0.1"
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
import { GraphicsSettings, Settings, saveSettings } from "../Settings";
import { lowerCase, capitalize } from "lodash";
export default {
    components: { SaveSettings },
    methods: {
        reset() {
            this.settings = new GraphicsSettings();
            saveSettings(Settings);
        },
        save() {
            Settings.graphics = this.settings;
            saveSettings(Settings);
        }
    },
    data() {
        const settings = new GraphicsSettings();
        Object.assign(settings, Settings.graphics);

        const toneMapItems = Object.entries(GraphicsSettings.ToneMap);
        const getLabelText = text => {
            text = lowerCase(text);
            text = capitalize(text);
            text = text.replace("tone mapping", "");
            return text;
        };

        return {
            settings,
            toneMapItems: toneMapItems.map(pair => {
                let [text, value] = pair;
                if (value === GraphicsSettings.ToneMap.NoToneMapping) {
                    text = "None";
                } else {
                    text = getLabelText(text);
                }

                return { text, value };
            })
        };
    }
};
</script>