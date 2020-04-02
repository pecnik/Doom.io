<template>
    <div class="panel">
        <div class="tile-select-dialog">
            <tile v-for="(key, tileId) in 64" :key="key"
                @click.native="setTileSlot(tileId)"
                class="tile"
                :class="{ active: tileId === activeTileId }"
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
        activeTileId() {
            return this.$store.getters.activeTileId;
        }
    },
    methods: {
        setTileSlot(tileId) {
            const close = this.activeTileId !== tileId;
            const index = this.tileIdSlotIndex;
            this.$store.dispatch("setTileIdSlot", { index, tileId });
            this.$store.dispatch("setTileSelectDialog", close);
        }
    }
};
</script>
<style scoped lang="scss">
.panel {
    max-width: 600px;
}

.tile-select-dialog {
    overflow-y: auto;
    max-height: 80vh;
    .tile {
        margin: 4px;
    }
}
</style>
