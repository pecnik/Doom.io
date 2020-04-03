<template>
    <div class="tile" :style="style"></div>
</template>
<script>
import { TILE_COLS, TILE_W, TILE_H } from "../Level";
export default {
    props: {
        tileId: { type: Number, required: true },
        lg: { type: Boolean, required: false, default: false }
    },
    computed: {
        style() {
            const size = this.lg ? 128 : 64;
            const url = "/assets/tileset.png";
            const x = Math.floor(this.tileId % TILE_COLS);
            const y = Math.floor(this.tileId / TILE_COLS);
            return {
                width: size + "px",
                height: size + "px",
                background: `url(${url})`,
                backgroundPosition: `-${x * size}px -${y * size}px`,
                backgroundSize: this.lg ? "1024px" : "512px"
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

    transition: transform 100ms ease-in, border-radius 100ms ease-in;
    cursor: pointer;
    display: inline-block;
    border: 1px solid #666;
    border-radius: 16px;
    transform: scale(0.95);

    &:hover,
    &.active {
        border-color: #999;
        transform: scale(1);
    }

    &.active {
        border-color: #2ecc71;
        border-radius: 0;
    }
}
</style>