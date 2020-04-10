<style scoped lang="scss">
.texture-option {
    display: inline-block;
    padding: 8px;
    font-size: 0;

    &:hover {
        cursor: pointer;
        background: #444;
    }

    &.active {
        background: cornflowerblue;
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