<template>
    <div>
        <v-menu offset-y min-width="200px">
            <template v-slot:activator="{ on }">
                <v-btn color="teal" v-on="on">
                    Level
                </v-btn>
            </template>
            <v-list>
                <v-list-item @click="resizeDialog.open = true">
                    <v-list-item-title>Resize level</v-list-item-title>
                </v-list-item>
                <v-list-item @click="floorDialog.open = true">
                    <v-list-item-title>Create floor</v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>

        <!-- Resize dialog -->
        <v-dialog v-model="resizeDialog.open" max-width="580px">
            <v-card>
                <v-card-title>Resize map</v-card-title>
                <v-card-text>
                    <v-slider
                        label="Width"
                        v-model="resizeDialog.width"
                        min="4"
                        max="64"
                        step="1"
                        thumb-label
                    >
                        <template v-slot:append>
                            <v-text-field
                                v-model="resizeDialog.width"
                                class="mt-0 pt-0"
                                hide-details
                                single-line
                                type="number"
                                style="width: 60px"
                            ></v-text-field>
                        </template>
                    </v-slider>
                    <v-slider
                        label="Height"
                        v-model="resizeDialog.height"
                        min="4"
                        max="64"
                        step="1"
                        thumb-label
                    >
                        <template v-slot:append>
                            <v-text-field
                                v-model="resizeDialog.height"
                                class="mt-0 pt-0"
                                hide-details
                                single-line
                                type="number"
                                style="width: 60px"
                            ></v-text-field>
                        </template>
                    </v-slider>
                    <v-slider
                        label="Deight"
                        v-model="resizeDialog.depth"
                        min="4"
                        max="64"
                        step="1"
                        thumb-label
                    >
                        <template v-slot:append>
                            <v-text-field
                                v-model="resizeDialog.depth"
                                class="mt-0 pt-0"
                                hide-details
                                single-line
                                type="number"
                                style="width: 60px"
                            ></v-text-field>
                        </template>
                    </v-slider>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" text @click="resizeDialog.open = false">Close</v-btn>
                    <v-btn color="blue darken-1" text @click="resizeMap">Resize</v-btn>
                </v-card-actions>
            </v-card>
         </v-dialog>

         <!-- Floor dialog -->
        <v-dialog v-model="floorDialog.open" max-width="580px">
            <v-card>
                <v-card-title>Create floor</v-card-title>
                <v-card-text>
                    <div class="mb-2">
                        <texture-input v-model="floorDialog.tileId"></texture-input>
                    </div>

                    <v-slider
                        label="Height"
                        v-model="floorDialog.height"
                        min="1"
                        max="8"
                        step="1"
                        thumb-label
                    >
                        <template v-slot:append>
                            <v-text-field
                                v-model="floorDialog.height"
                                class="mt-0 pt-0"
                                hide-details
                                single-line
                                type="number"
                                style="width: 60px"
                            ></v-text-field>
                        </template>
                    </v-slider>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" text @click="floorDialog.open = false">Close</v-btn>
                    <v-btn color="blue darken-1" text @click="createFloor">Create</v-btn>
                </v-card-actions>
            </v-card>
         </v-dialog>
    </div>
</template>
<script>
import TextureInput from "./TextureInput.vue";
import { editor } from "../Editor";
export default {
    components: { TextureInput },
    methods: {
        resizeMap() {
            this.resizeDialog.open = false;
            editor.resizeLevel(
                this.resizeDialog.width,
                this.resizeDialog.height,
                this.resizeDialog.depth
            );
        },
        createFloor() {
            this.floorDialog.open = false;
            editor.createLevelFloor(
                this.floorDialog.height,
                this.floorDialog.tileId
            );
        }
    },
    data() {
        return {
            resizeDialog: {
                open: false,
                width: 16,
                height: 8,
                depth: 16
            },
            floorDialog: {
                open: false,
                height: 1,
                tileId: 16
            }
        };
    }
};
</script>