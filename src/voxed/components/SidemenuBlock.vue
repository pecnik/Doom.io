<template>
    <div>
        <v-radio-group v-model="value" column>
            <v-radio v-for="item in items"
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
            value: VoxelType.Block,
            items: [
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