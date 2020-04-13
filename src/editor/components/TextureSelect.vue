<template>
    <div class="texture-list">
        <div v-for="(tile, key) in tiles"
            :key="key + 1"
            :class="{ active: key === index }"
            class="texture-option"
            @click="$emit('input', key)">
            <texture-tile :tile="tile"></texture-tile>
        </div>
    </div>
</template>
<script>
import TextureTile from "./TextureTile.vue";
export default {
    props: {
        tiles: { type: Array, required: true },
        index: { type: Number, required: true }
    },
    components: { TextureTile }
};
</script>
<style scoped lang="scss">
.texture-list {
    padding-left: 16px;
    padding-top: 16px;
    background: black;
}

.texture-option {
    position: relative;
    display: inline-block;
    margin-right: 14px;
    margin-bottom: 16px;
    font-size: 0;
    line-height: 1;
    border: 1px solid black;

    &:hover {
        cursor: pointer;
        -webkit-box-shadow: 0px 0px 4px 2px rgba(255, 255, 255, 0.5);
        -moz-box-shadow: 0px 0px 4px 2px rgba(255, 255, 255, 0.5);
        box-shadow: 0px 0px 4px 2px rgba(255, 255, 255, 0.5);
    }

    &.active {
        -webkit-box-shadow: 0px 0px 8px 2px rgba(255, 255, 255, 1);
        -moz-box-shadow: 0px 0px 8px 2px rgba(255, 255, 255, 1);
        box-shadow: 0px 0px 8px 2px rgba(255, 255, 255, 1);
    }
}
</style>