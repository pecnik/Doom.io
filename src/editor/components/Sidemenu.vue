<template>
    <div>
        <v-card color="teal" class="mb-8">
            <v-card-text>
                <v-btn v-for="tool in tools"
                    :key="tool"
                    :color="tool === toolId ? 'primary' : 'default'"
                    @click="setToolId(tool)"
                    class="mr-2">{{ tool }}</v-btn>
            </v-card-text>
        </v-card>
        <v-card color="teal" class="mb-8">
            <v-card-text>
                <sidemenu-texture></sidemenu-texture>
            </v-card-text>
        </v-card>
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