<template>
    <div>
        <div v-for="(tileId, index) in tileIdSlotArray" :key="index + 1">
            <tile class="tile" :class="{ active: index === tileIdSlotIndex }" :tileId="tileId"></tile>
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
    }
};
</script>
<style scoped lang="scss">
.tile {
    // transition: transform 100ms ease;
    margin-bottom: 8px;
    border: 1px solid #666;
    &.active {
        border-color: limegreen;
        transform: scale(1.05);
    }
}
</style>
