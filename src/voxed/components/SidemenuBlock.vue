<template>
    <div>
        <v-radio-group v-model="voxelType" column>
            <v-radio v-for="item in voxelTypes"
                :key="item.value"
                :label="item.label"
                :value="item.value"></v-radio>
        </v-radio-group>
    </div>
</template>
<script>
import { VoxelType } from "../../game/data/Level";
export default {
    data() {
        return {
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