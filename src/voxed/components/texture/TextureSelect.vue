<template>
    <div>
        <div v-for="(tile, key) in tiles"
            :key="key + 1"
            :class="{ active: key === index }"
            @click="$emit('input', key)"
            class="texture-option">
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
@import "~vuetify/src/styles/main.sass";

.texture-option {
    position: relative;
    display: inline-block;
    margin: 4px;
    padding: 4px;
    border-radius: 8px;
    font-size: 0;
    line-height: 1;

    &:hover {
        cursor: pointer;
        background-color: map-get($teal, "darken-3");
    }

    &.active {
        background-color: map-get($teal, "lighten-3");
    }

    .texture-dialog-toggle {
        display: none;
    }

    &:hover > .texture-dialog-toggle {
        position: absolute;
        bottom: 6px;
        right: 6px;
        display: block;
        width: 24px;
        height: 24px;
        text-align: center;
        line-height: 24px;
        background-color: map-get($teal, "darken-3");
    }
}
</style>