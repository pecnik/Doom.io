<template>
    <div>
        <tile v-for="(tileId, index) in tileIdSlotArray"
            class="tile"
            @click.native="openTileSelectDialog(index)"
            :key="index + 1"
            :class="{ active: index === tileIdSlotIndex }"
            :tileId="tileId"></tile>
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
    margin: 7px;
}
</style>
