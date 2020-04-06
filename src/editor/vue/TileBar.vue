<template>
    <div>
        <div class="tile-bar">
            <tile v-for="(tileId, index) in tileIdSlotArray"
                class="tile"
                @click.native="openTileSelectDialog(index)"
                :key="index + 1"
                :class="{ active: index === tileIdSlotIndex }"
                :tileId="tileId"></tile>
        </div>
        <v-dialog v-model="dialog" max-width="80vw">
            <v-card>
                <v-card-title class="headline">Select texture</v-card-title>
                <v-card-text>
                    <div class="tile-select-dialog">
                        <tile v-for="(key, tileId) in 64" :key="key"
                            @click.native="setTileSlot(tileId)"
                            class="tile"
                            :class="{ active: tileId === dialogTileId }"
                            :tileId="tileId"></tile>
                    </div>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="green darken-1" text @click="dialog = false">Close</v-btn>
                    <v-btn color="green darken-1" text @click="confirm">Select</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>
<script>
import Tile from "./Tile.vue";
export default {
    components: { Tile },
    computed: {
        tileIdSlotIndex() {
            return this.$store.state.tileIdSlotIndex;
        },
        tileIdSlotArray() {
            return this.$store.state.tileIdSlotArray;
        }
    },
    methods: {
        openTileSelectDialog(index) {
            this.dialog = true;
            this.dialogIndex = index;
            this.dialogTileId = this.$store.getters.activeTileId;
        },
        setTileSlot(tileId) {
            this.dialogTileId = tileId;
        },
        confirm() {
            const index = this.dialogIndex;
            const tileId = this.dialogTileId;
            this.$store.dispatch("setTileIdSlot", { index, tileId });
            this.$store.dispatch("setTileSelectDialog", close);
            this.dialog = false;
        }
    },
    data() {
        return {
            dialog: false,
            dialogIndex: -1,
            dialogTileId: -1
        };
    }
};
</script>
<style scoped lang="scss">
.tile-bar {
    display: flex;
    padding: 16px;

    .tile {
        margin-right: 16px;
    }
}
</style>
