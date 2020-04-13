<template>
    <div>
        <v-btn v-for="tool in tools"
            :key="tool"
            :color="tool === toolId ? 'primary' : 'default'"
            @click="setToolId(tool)"
            class="mr-2">{{ tool }}</v-btn>
    </div>
</template>
<script>
export default {
    computed: {
        toolId() {
            return this.$store.state.toolId;
        }
    },
    data() {
        return {
            tools: ["block", "paint", "entity"]
        };
    },
    methods: {
        setToolId(tool) {
            this.$store.state.toolId = tool;
        }
    }
};
</script>