<template>
    <div class="tile" :style="style"></div>
</template>
<script>
import { TILE_COLS } from "../Level";
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
}
</style>