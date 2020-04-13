<template>
    <div>
        <v-switch
            color="teal"
            label="Render wireframe"
            :input-value="renderWireframe"
            @change="toggleWireframe"></v-switch>
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
        renderWireframe() {
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