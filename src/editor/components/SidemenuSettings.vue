<template>
    <div>
        <div class="mb-4">
            <v-btn small>
                <label>
                    Open level <v-icon class="ml-2" small>mdi-upload</v-icon>
                    <input style="display: none;" type="file" @input="loadLevel">
                </label>
            </v-btn>
            <v-btn small @click="saveLevel">Save level <v-icon class="ml-2" small>mdi-content-save</v-icon></v-btn>
        </div>
        <v-btn small @click="dialog = true">Settings <v-icon class="ml-2" small>mdi-settings</v-icon></v-btn>
        <v-dialog v-model="dialog" max-width="550px">
            <v-card>
                <v-card-title>Settings</v-card-title>
                <v-card-text>
                    <v-switch
                        color="teal"
                        label="Render lighting"
                        :input-value="renderLighting"
                        @change="toggleLighting"></v-switch>
                    <v-switch
                        color="teal"
                        label="Render wireframe"
                        :input-value="renderWireframe"
                        @change="toggleWireframe"></v-switch>
                </v-card-text>
            </v-card>
         </v-dialog>
    </div>
</template>
<script>
import { editor } from "../Editor";
export default {
    computed: {
        renderLighting() {
            return this.$store.state.renderWireframe;
        },
        renderWireframe() {
            return this.$store.state.renderWireframe;
        }
    },
    methods: {
        toggleLighting(value) {
            this.$store.state.renderLighting = value;
        },
        toggleWireframe(value) {
            this.$store.state.renderWireframe = value;
        },
        loadLevel(ev) {
            const files = ev.target.files;
            const file = files[0];
            const reader = new FileReader();
            reader.onload = ev => {
                const level = JSON.parse(ev.target.result);
                editor.level.data = level;
                editor.level.updateGeometry();
            };
            reader.readAsText(file);
        },
        saveLevel() {
            function download(content, fileName, contentType) {
                const a = document.createElement("a");
                const file = new Blob([content], { type: contentType });
                a.href = URL.createObjectURL(file);
                a.download = fileName;
                a.click();
            }

            const jsonData = JSON.stringify(editor.level.data);
            const date = new Date();
            const time = [
                date.getFullYear(),
                date.getMonth() + 1,
                date.getDay(),
                date.getHours(),
                date.getMinutes(),
                date.getSeconds()
            ].join("-");
            download(jsonData, `level_${time}.json`, "text/plain");
        }
    },
    data() {
        return {
            dialog: false
        };
    }
};
</script>