<template>
    <v-dialog v-model="localValue" max-width="580px">
        <v-card>
            <v-card-title>Re-texture level</v-card-title>
            <v-card-text>
                <div class="mb-1">
                    <label>Top:</label>
                    <texture-input v-model="textureIdTop"></texture-input>
                </div>
                <div class="mb-1">
                    <label>Mid:</label>
                    <texture-input v-model="textureIdMid"></texture-input>
                </div>
                <div class="mb-1">
                    <label>Bot:</label>
                    <texture-input v-model="textureIdBot"></texture-input>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-btn color="teal" @click="close">
                    Cancel
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn color="teal" @click="confirm">
                    Re-texture
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script>
import TextureInput from "./TextureInput.vue";
import { editor } from "../Editor";

export default {
    components: { TextureInput },
    props: {
        value: { type: Boolean, required: true }
    },
    watch: {
        value: {
            handler(value) {
                if (this.localValue !== value) {
                    this.localValue = value;
                }
            }
        },
        localValue: {
            handler(localValue) {
                this.$emit("input", localValue);
            }
        }
    },
    methods: {
        close() {
            this.localValue = false;
        },
        confirm() {
            if (editor.level.blocks.length === 0) {
                console.warn("Level has no blocks");
                return;
            }

            editor.commitLevelMutation(level => {
                const block = level.blocks[0];
                const indexTop = block.getFaceIndex({ x: 0, y: 1, z: 0 });
                const indexBot = block.getFaceIndex({ x: 0, y: -1, z: 0 });
                const indexMid = [
                    block.getFaceIndex({ x: 1, y: 0, z: 0 }),
                    block.getFaceIndex({ x: -1, y: 0, z: 0 }),
                    block.getFaceIndex({ x: 0, y: 0, z: 1 }),
                    block.getFaceIndex({ x: 0, y: 0, z: -1 })
                ];

                level.blocks.forEach(block => {
                    block.faces[indexTop] = this.textureIdTop;
                    block.faces[indexBot] = this.textureIdBot;
                    indexMid.forEach(index => {
                        block.faces[index] = this.textureIdMid;
                    });
                });
            });

            this.close();

            // editor.commitLevelMutation(level => {
            //     const blocks = level.blocks[0];
            // });
            // this.close();
            // editor.confirm(this.dialog.w, this.dialog.h, this.dialog.d);
        }
    },
    data() {
        return {
            localValue: false,
            textureIdTop: 0,
            textureIdMid: 1,
            textureIdBot: 2
        };
    }
};
</script>
