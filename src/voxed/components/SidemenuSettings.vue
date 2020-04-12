<template>
    <div>
         <v-checkbox
            label="Render wireframe"
            :input-value="wireframe"
            @change="toggleWireframe"></v-checkbox>
    </div>
</template>
<script>
import { Tool_ID } from "../tools/Tool";
export default {
    data() {
        return {
            items: Object.keys(Tool_ID)
        };
    },
    computed: {
        wireframe() {
            return this.$store.state.renderWireframe;
        }
    },
    methods: {
        toggleWireframe(value) {
            this.$store.state.renderWireframe = value;
        }
    }
};
</script>