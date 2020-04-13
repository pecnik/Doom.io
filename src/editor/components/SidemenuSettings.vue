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
export default {
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