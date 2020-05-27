<template>
    <div>
         <v-menu offset-y min-width="200px">
            <template v-slot:activator="{ on }">
                <v-btn color="teal" v-on="on">
                    File
                </v-btn>
            </template>
            <v-list>
                <v-list-item @click="newFile">
                    <v-list-item-title>New</v-list-item-title>
                </v-list-item>
                <v-divider></v-divider>
                <v-list-item @click="save">
                    <v-list-item-title>Save</v-list-item-title>
                </v-list-item>
                <v-list-item @click="() => {}">
                    <v-list-item-title>
                        <label>
                            Load
                            <input style="display: none;" type="file" @input="load">
                        </label>
                    </v-list-item-title>
                </v-list-item>
                <v-divider></v-divider>
                <v-list-item >
                    <v-list-item-title>Play</v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>
    </div>
</template>
<script>
import { editor } from "../Editor";
export default {
    methods: {
        newFile() {
            if (confirm("New level?")) {
                editor.level.resize(
                    editor.level.width,
                    editor.level.height,
                    editor.level.depth
                );
                editor.resizeLevel(
                    editor.level.width,
                    editor.level.height,
                    editor.level.depth
                );
                editor.commitChange();
            }
        },
        save() {
            function download(content, fileName, contentType) {
                const a = document.createElement("a");
                const file = new Blob([content], { type: contentType });
                a.href = URL.createObjectURL(file);
                a.download = fileName;
                a.click();
            }

            const name = prompt("name?");
            if (name) {
                const jsonData = JSON.stringify(editor.level.toJSON(), null, 4);
                download(jsonData, `${name}.json`, "text/plain");
            }
        },
        load(ev) {
            const files = ev.target.files;
            const file = files[0];
            const reader = new FileReader();
            reader.onload = ev => {
                const level = JSON.parse(ev.target.result);
                editor.setJson(level);
            };
            reader.readAsText(file);
        }
    }
};
</script>
<style scoped lang="scss">
label {
    width: 100%;
    display: block;
}
</style>