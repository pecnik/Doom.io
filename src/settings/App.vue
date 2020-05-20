<template>
    <v-app>
        <v-container class="container">
            <h2 class="mb-4">Settings</h2>
            <div class="mb-4">
                <v-btn color="primary" @click="reset">Reset</v-btn>
            </div>
            <v-list class="mb-4">
                <v-list-item>
                    <v-list-item-title>Stats</v-list-item-title>
                </v-list-item>
                <v-list-item>
                    <v-switch label="FPS Meter" v-model="settings.fpsMeter"></v-switch>
                </v-list-item>
            </v-list>

            <v-list class="mb-4">
                <v-list-item>
                    <v-list-item-title>Controls</v-list-item-title>
                </v-list-item>
                <v-list-item>
                    <v-slider
                        label="Mouse sensitivity"
                        v-model="settings.mouseSensitivity"
                        min="0.1"
                        max="1"
                        step="0.01"
                        thumb-label
                    ></v-slider>
                </v-list-item>
            </v-list>

            <v-list class="mb-4">
                <v-list-item>
                    <v-list-item-title>Rendering</v-list-item-title>
                </v-list-item>
                <v-list-item>
                    <v-switch label="Antialiasing" v-model="settings.antialiasing"></v-switch>
                </v-list-item>
                <v-list-item>
                    <v-slider
                        label="Render resolution"
                        v-model="settings.renderResolution"
                        min="0.25"
                        max="1"
                        step="0.25"
                        thumb-label
                    ></v-slider>
                </v-list-item>
            </v-list>

            <v-list class="mb-4">
                <v-list-item>
                    <v-list-item-title>Advanced</v-list-item-title>
                </v-list-item>
                <v-list-item>
                    <v-select
                        label="Tone mapping"
                        solo
                        v-model="settings.toneMapping"
                        :items="toneMappingItems"
                    ></v-select>
                </v-list-item>
                <v-list-item v-if="settings.toneMapping > 0">
                    <v-slider
                        label="Exposure"
                        v-model="settings.toneMappingExposure"
                        min="0.1"
                        max="2"
                        step="0.1"
                        thumb-label
                    ></v-slider>
                </v-list-item>
            </v-list>
        </v-container>
    </v-app>
</template>
<script>
import { Settings, ToneMapping, SettingsProps } from "../game/Settings";
import { cloneDeep, debounce } from "lodash";

export default {
    data() {
        return {
            settings: cloneDeep(Settings.props),
            toneMappingItems: Object.entries(ToneMapping).map(pair => {
                const [text, value] = pair;
                return { text, value };
            })
        };
    },
    watch: {
        settings: {
            deep: true,
            handler: debounce(function(settings) {
                Settings.save(settings);
            }, 100)
        }
    },
    methods: {
        reset() {
            setTimeout(() => {
                if (confirm("Reset settings?")) {
                    this.settings = new SettingsProps();
                }
            }, 100);
        }
    }
};
</script>
<style scoped lang="scss">
.container {
    max-width: 400px;
}
</style>