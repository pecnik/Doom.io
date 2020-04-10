<style scoped lang="scss">
@import "~vuetify/src/styles/main.sass";

.texture-option {
    display: inline-block;
    margin: 4px;
    padding: 4px;
    font-size: 0;
    border-radius: 8px;

    &:hover {
        cursor: pointer;
        background-color: map-get($teal, "darken-3");
    }

    &.active {
        background-color: map-get($teal, "lighten-3");
    }
}
</style>
<template>
    <div>
        <div v-for="(tileId, key) in slots"
            :key="key + 1"
            :class="{ active: key === index }"
            @click="setIndex(key)"
            class="texture-option">
            <texture :tileId="tileId"></texture>
        </div>
    </div>
</template>
<script>
import Texture from "./Texture.vue";
export default {
    components: { Texture },
    computed: {
        slots() {
            return this.$store.state.texture.slots;
        },
        index() {
            return this.$store.state.texture.index;
        }
    },
    methods: {
        setIndex(index) {
            this.$store.state.texture.index = index;
        }
    }
};
</script>