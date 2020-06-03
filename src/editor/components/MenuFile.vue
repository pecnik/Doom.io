<template>
    <div>
        <v-menu offset-y min-width="200px">
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

        <v-menu offset-y min-width="200px">
            <template v-slot:activator="{ on }">
                <v-btn color="teal" small v-on="on">
                    Level
                </v-btn>
            </template>
            <v-list>
                <v-list-item @click="openResizeLevel">
                    <v-list-item-title>
                        Resize
                    </v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>

        <!-- Resize dialog -->
        <v-dialog v-model="resizeDialog.open" max-width="580px">
            <v-card>
                <v-card-title>Resize level</v-card-title>
                <v-card-text>
                    <v-text-field type="number" label="Width" v-model="resizeDialog.w"></v-text-field>
                    <v-text-field type="number" label="height" v-model="resizeDialog.h"></v-text-field>
                    <v-text-field type="number" label="depth" v-model="resizeDialog.d"></v-text-field>
                </v-card-text>
                <v-card-actions>
                    <v-btn color="teal" @click="resizeDialog.open = false">
                        Disagree
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="teal" @click="resizeLevel">
                        Resize
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
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
        },
        openResizeLevel() {
            this.resizeDialog.open = true;
            this.resizeDialog.w = editor.level.width;
            this.resizeDialog.h = editor.level.height;
            this.resizeDialog.d = editor.level.depth;
        },
        resizeLevel() {
            this.resizeDialog.open = false;
            editor.resizeLevel(
                this.resizeDialog.w,
                this.resizeDialog.h,
                this.resizeDialog.d
            );
        }
    },
    data() {
        return {
            resizeDialog: { open: false, w: 0, h: 0, d: 0 }
        };
    }
};
</script>
