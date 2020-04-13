<template>
    <div>
        <div class="mb-8">
            <v-btn v-for="tool in tools"
                :key="tool"
                :color="tool === toolId ? 'primary' : 'default'"
                @click="setToolId(tool)"
                class="mr-2">{{ tool }}</v-btn>
        </div>
        <div class="mb-8">
            <sidemenu-texture></sidemenu-texture>
        </div>
    </div>
</template>
<script>
import SidemenuTexture from "./SidemenuTexture.vue";
export default {
    components: { SidemenuTexture },
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