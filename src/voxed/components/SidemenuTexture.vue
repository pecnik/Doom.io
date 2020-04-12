<template>
    <div class="mt-2">
        <v-btn @click="changeTexture"><v-icon>mdi-image</v-icon></v-btn>
        <v-btn @click="addSlot"><v-icon>mdi-plus</v-icon></v-btn>
        <v-btn @click="removeSlot"><v-icon>mdi-minus</v-icon></v-btn>
        <texture-select
            :tiles="slots"
            :index="index"
            @input="selectTextureSlot"></texture-select>
         <v-dialog v-model="dialog.open" max-width="550px">
            <v-card>
                <v-card-title class="headline">Select texture</v-card-title>
                <v-card-text>
                    <texture-select
                        :tiles="dialog.tiles"
                        :index="dialog.index"
                        @input="setTextureSlot"></texture-select>
                </v-card-text>
            </v-card>
         </v-dialog>
    </div>
</template>
<script>
import Vue from "vue";
import TextureTile from "./texture/TextureTile.vue";
import TextureSelect from "./texture/TextureSelect.vue";
import { range } from "lodash";
export default {
    components: { TextureSelect },
    computed: {
        slots() {
            return this.$store.state.texture.slots;
        },
        index() {
            return this.$store.state.texture.index;
        }
    },
    methods: {
        selectTextureSlot(index) {
            this.$store.state.texture.index = index;
        },
        changeTexture() {
            const { slots, index } = this.$store.state.texture;
            this.dialog.open = true;
            this.dialog.index = slots[index];
        },
        setTextureSlot(tile) {
            const { texture } = this.$store.state;
            Vue.set(texture.slots, texture.index, tile);
            this.dialog.open = false;
        },
        addSlot() {
            this.$store.state.texture.slots.push(0);
        },
        removeSlot() {
            this.$store.state.texture.slots.pop();
            this.$store.state.texture.index = Math.min(
                this.$store.state.texture.slots.length - 1,
                this.$store.state.texture.index
            );
        }
    },
    data() {
        return {
            dialog: { open: false, index: 0, tiles: range(0, 64) }
        };
    }
};
</script>