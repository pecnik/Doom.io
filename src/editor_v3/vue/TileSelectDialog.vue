<template>
    <div>
        <h2>Tile select #{{ tileIdSlotIndex + 1 }}</h2>
        <tile v-for="tileId in 64" :key="tileId + 1"
            @click.native="setTileSlot(tileId)"
            class="tile"
            :class="{ active: tileId === activeTileId }"
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
        activeTileId() {
            return this.$store.getters.activeTileId;
        }
    },
    methods: {
        setTileSlot(tileId) {
            const index = this.tileIdSlotIndex;
            this.$store.dispatch("setTileIdSlot", { index, tileId });
            this.$store.dispatch("setTileSelectDialog", false);
        }
    }
};
</script>
<style scoped lang="scss">
.tile {
    margin: 4px;
}
</style>
