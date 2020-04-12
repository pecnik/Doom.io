<template>
    <div>
        <v-radio-group v-model="voxelType" column>
            <v-radio v-for="item in voxelTypes"
                :key="item.value"
                :label="item.label"
                :value="item.value"></v-radio>
        </v-radio-group>
        <texture-select
            :tiles="slots"
            :index="index"
            @input="selectTexture"></texture-select>
    </div>
</template>
<script>
import TextureTile from "./texture/TextureTile.vue";
import TextureSelect from "./texture/TextureSelect.vue";
import { VoxelType } from "../../game/data/Level";
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
        selectTexture(idnex) {
            console.log({ index });
        }
    },
    data() {
        return {
            tileId: 0,
            voxelType: VoxelType.Block,
            voxelTypes: [
                {
                    label: "Block",
                    value: VoxelType.Block
                },
                {
                    label: "Slope",
                    value: VoxelType.Slope
                }
            ]
        };
    }
};
</script>