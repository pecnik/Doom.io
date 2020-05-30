<template>
    <div class="tile-wrapper">
        <div class="tile" :style="style"></div>
    </div>
</template>
<script>
const TILE_W = 64;
const TILE_COLS = 512 / TILE_W;

export default {
    props: {
        tile: { type: Number, required: true }
    },
    computed: {
        style() {
            const cols = TILE_COLS;
            const size = TILE_W;
            const url = "/assets/tileset.png";
            const x = Math.floor(this.tile % cols) * size;
            const y = Math.floor(this.tile / cols) * size;
            return {
                width: size + "px",
                height: size + "px",
                background: `url(${url})`,
                backgroundPosition: `-${x}px -${y}px`
            };
        }
    }
};
</script>
<style scoped lang="scss">
.tile-wrapper {
    display: inline-block;
    width: 64px;
    height: 64px;
    .tile {
        display: inline-block;
        transform-origin: 0 0;
        image-rendering: pixelated;
    }
}
</style>