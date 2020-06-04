<template>
    <v-dialog v-model="localValue" max-width="580px">
        <v-card>
            <v-card-title>Resize level</v-card-title>
            <v-card-text>
                <v-text-field
                    type="number"
                    label="Width"
                    v-model="dialog.w"
                ></v-text-field>
                <v-text-field
                    type="number"
                    label="height"
                    v-model="dialog.h"
                ></v-text-field>
                <v-text-field
                    type="number"
                    label="depth"
                    v-model="dialog.d"
                ></v-text-field>
            </v-card-text>
            <v-card-actions>
                <v-btn color="teal" @click="close">
                    Cancel
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn color="teal" @click="resizeLevel">
                    Resize
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script>
import { editor } from "../Editor";
export default {
    props: {
        value: { type: Boolean, required: true }
    },
    watch: {
        value: {
            handler(value) {
                if (this.localValue !== value) {
                    this.localValue = value;
                }

                if (value) {
                    this.dialog.w = editor.level.width;
                    this.dialog.h = editor.level.height;
                    this.dialog.d = editor.level.depth;
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
        resizeLevel() {
            this.close();
            editor.resizeLevel(this.dialog.w, this.dialog.h, this.dialog.d);
        }
    },
    data() {
        return {
            localValue: false,
            dialog: { w: 0, h: 0, d: 0 }
        };
    }
};
</script>
