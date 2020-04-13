<template>
    <div>
        <texture-select
            class="mb-1"
            :tiles="slots"
            :index="index"
            @input="setTextureSlotIndex"></texture-select>

        <v-btn block class="mb-2" @click="openTextureDialog">
            SLOT: {{ index + 1 }} CHANGE TEXTURE
        </v-btn>

        <v-btn small @click="addSlot">Add slot <v-icon class="ml-2" small>mdi-plus</v-icon></v-btn>
        <v-btn small @click="removeSlot">Remove slot <v-icon class="ml-2" small>mdi-minus</v-icon></v-btn>

         <v-dialog v-model="dialog.open" max-width="500px">
            <v-card>
                <v-card-title>Select texture</v-card-title>
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
import TextureTile from "./TextureTile.vue";
import TextureSelect from "./TextureSelect.vue";
import { range } from "lodash";
export default {
    components: { TextureSelect },
    computed: {
        slots() {
            return this.$store.state.textureSlots;
        },
        index() {
            return this.$store.state.textureSlotIndex;
        },
        tileId() {
            return this.$store.getters.tileId;
        }
    },
    methods: {
        setTextureSlotIndex(index) {
            this.$store.state.textureSlotIndex = index;
        },
        setTextureSlot(tileId) {
            const { textureSlots, textureSlotIndex } = this.$store.state;
            Vue.set(textureSlots, textureSlotIndex, tileId);
            this.dialog.open = false;
        },
        openTextureDialog() {
            this.dialog.open = true;
            this.dialog.index = this.tileId;
        },
        addSlot() {
            this.$store.state.textureSlots.push(0);
        },
        removeSlot() {
            this.$store.state.textureSlots.pop();
            this.$store.state.textureSlotIndex = Math.min(
                this.$store.state.textureSlots.length - 1,
                this.$store.state.textureSlotIndex
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