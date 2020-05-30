<template>
    <div>
         <v-menu offset-y open-on-hover min-width="200px">
            <template v-slot:activator="{ on }">
                <v-btn color="teal" small v-on="on">
                    File
                </v-btn>
            </template>
            <v-list>
                <v-list-item @click="newFile">
                    <v-list-item-title>
                        New
                    </v-list-item-title>
                </v-list-item>
                <v-divider></v-divider>
                <v-list-item @click="save">
                    <v-list-item-title>
                        Save
                        <!-- <v-icon class="ml-2" small>mdi-content-save</v-icon> -->
                    </v-list-item-title>
                </v-list-item>
                <v-list-item @click="() => {}" tag="label" for="levelSelect">
                    <v-list-item-title>
                        Load
                        <!-- <v-icon class="ml-2" small>mdi-upload</v-icon> -->
                        <input id="levelSelect" style="display: none;" type="file" @input="load">
                    </v-list-item-title>
                </v-list-item>
                <v-divider></v-divider>
                <v-list-item @click="play">
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
            setTimeout(() => {
                if (confirm("New level?")) {
                    editor.commitLevelMutation(level => {
                        level.resize(
                            editor.level.width,
                            editor.level.height,
                            editor.level.depth
                        );
                    });
                }
            }, 100);
        },
        save() {
            function download(content, fileName, contentType) {
                const a = document.createElement("a");
                const file = new Blob([content], { type: contentType });
                a.href = URL.createObjectURL(file);
                a.download = fileName;
                a.click();
            }

            setTimeout(() => {
                const name = prompt("name?");
                if (name) {
                    const json = editor.level.toJson();
                    const text = JSON.stringify(json, null, 4);
                    download(text, `${name}.json`, "text/plain");
                }
            }, 100);
        },
        load(ev) {
            const files = ev.target.files;
            const file = files[0];
            const reader = new FileReader();
            reader.onload = ev => {
                editor.commitLevelMutation(level => {
                    const json = JSON.parse(ev.target.result);
                    level.readJson(json);
                });
            };
            reader.readAsText(file);
        },
        play() {
            const json = editor.level.toJson();
            localStorage.setItem("level", JSON.stringify(json));

            const url = [location.origin, location.pathname].join("");
            window.open(url + "#/game/singleplayer");
        }
    }
};
</script>
