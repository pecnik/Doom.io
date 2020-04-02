<template>
    <div>
        <div v-for="(tileId, index) in tileIdSlotArray" :key="index + 1">
            <tile @click.native="openTileSelectDialog(index)"
                class="tile"
                :class="{ active: index === tileIdSlotIndex }"
                :tileId="tileId"></tile>
        </div>
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
            this.$store.dispatch("setTileIdSlotIndex", index);
            this.$store.dispatch("setTileSelectDialog", true);
        }
    }
};
</script>
<style scoped lang="scss">
.tile {
    margin-bottom: 8px;
}
</style>
