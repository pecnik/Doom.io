<template>
    <div>
        <v-switch
            color="teal"
            label="Render lighting"
            :input-value="renderLighting"
            @change="toggleLighting"></v-switch>
        <v-switch
            color="teal"
            label="Render wireframe"
            :input-value="renderWireframe"
            @change="toggleWireframe"></v-switch>
    </div>
</template>
<script>
export default {
    computed: {
        renderLighting() {
            return this.$store.state.renderWireframe;
        },
        renderWireframe() {
            return this.$store.state.renderWireframe;
        }
    },
    methods: {
        toggleLighting(value) {
            this.$store.state.renderLighting = value;
        },
        toggleWireframe(value) {
            this.$store.state.renderWireframe = value;
        }
    }
};
</script>