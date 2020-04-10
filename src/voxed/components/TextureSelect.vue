<style scoped lang="scss">
@import "~vuetify/src/styles/main.sass";

.texture-option {
    display: inline-block;
    margin: 4px;
    padding: 4px;
    border-radius: 8px;
    font-size: 0;
    line-height: 1;

    &:hover {
        cursor: pointer;
        background-color: map-get($teal, "darken-3");
    }

    &.active {
        background-color: map-get($teal, "lighten-3");
    }
}
</style>
<template>
    <div>
        <div v-for="(tileId, key) in slots"
            :key="key + 1"
            :class="{ active: key === index }"
            @click="onSlotClick(key)"
            class="texture-option">
            <texture :tileId="tileId"></texture>
        </div>
         <v-dialog v-model="dialog.open" max-width="550px">
            <v-card>
                <v-card-title class="headline">Select texture</v-card-title>
                <v-card-text>
                    <div>
                        <div v-for="(key, tileId) in 64" :key="key"
                            :class="{ active: tileId === dialog.tileId }"
                            @click="selectDialogTexture(tileId)"
                            class="texture-option">
                            <texture :tileId="tileId"></texture>
                        </div>
                    </div>
                </v-card-text>
            </v-card>
        </v-dialog>
    </div>
</template>
<script>
import Texture from "./Texture.vue";
export default {
    components: { Texture },
    computed: {
        slots() {
            return this.$store.state.texture.slots;
        },
        index() {
            return this.$store.state.texture.index;
        }
    },
    methods: {
        onSlotClick(index) {
            this.$store.state.texture.index = index;
            this.dialog.tileId = this.slots[index];
            this.dialog.open = true;
        },
        selectDialogTexture(tileId) {
            const { texture } = this.$store.state;
            texture.slots[texture.index] = tileId;
            this.dialog.open = false;
        }
    },
    data() {
        return {
            dialog: { open: false, tileId: 0 }
        };
    }
};
</script>