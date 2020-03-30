<template>
    <div class="tile" :style="style"></div>
</template>
<script>
import { TILE_COLS, TILE_W, TILE_H } from "../EditorUtils";
export default {
    props: {
        tileId: { type: Number, required: true }
    },
    computed: {
        style() {
            const url = "/assets/tileset.png";
            const x = Math.floor(this.tileId % TILE_COLS);
            const y = Math.floor(this.tileId / TILE_COLS);
            return {
                background: `url(${url})`,
                backgroundPosition: `-${x * TILE_W}px -${y * TILE_H}px`
            };
        }
    }
};
</script>
<style scoped lang="scss">
.tile {
    display: inline-block;
    width: 64px;
    height: 64px;
}
</style>