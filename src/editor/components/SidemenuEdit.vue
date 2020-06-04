<template>
    <span>
        <v-menu offset-y min-width="200px">
            <template v-slot:activator="{ on }">
                <v-btn color="teal" small v-on="on">
                    Edit
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
                    <v-text-field
                        type="number"
                        label="Width"
                        v-model="resizeDialog.w"
                    ></v-text-field>
                    <v-text-field
                        type="number"
                        label="height"
                        v-model="resizeDialog.h"
                    ></v-text-field>
                    <v-text-field
                        type="number"
                        label="depth"
                        v-model="resizeDialog.d"
                    ></v-text-field>
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
    </span>
</template>
<script>
import { editor } from "../Editor";
export default {
    methods: {
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
