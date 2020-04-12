<template>
    <div>
        <texture-select
            :tiles="slots"
            :index="index"
            @input="selectTexture"></texture-select>
    </div>
</template>
<script>
import TextureTile from "./texture/TextureTile.vue";
import TextureSelect from "./texture/TextureSelect.vue";
export default {
    components: { TextureSelect },
    computed: {
        slots() {
            return this.$store.state.texture.slots;
        },
        index() {
            return this.$store.state.texture.index;
        }
    },
    methods: {
        selectTexture(index) {
            this.$store.state.texture.index = index;
        }
    },
    data() {
        return {
            tileId: 0
        };
    }
};
</script>