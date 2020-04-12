<template>
    <div class="tile" :style="style"></div>
</template>
<script>
export default {
    props: {
        tile: { type: Number, required: true }
    },
    computed: {
        style() {
            const cols = 8;
            const size = 64;
            const url = "/assets/tileset.png";
            const x = Math.floor(this.tile % cols) * size;
            const y = Math.floor(this.tile / cols) * size;
            return {
                width: size + "px",
                height: size + "px",
                background: `url(${url})`,
                backgroundSize: "512px",
                backgroundPosition: `-${x}px -${y}px`
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