<template>
    <div>
        <v-card color="teal" class="mb-4">
            <v-card-text>
                <v-btn v-for="tool in tools"
                    :key="tool"
                    :color="tool === toolId ? 'deep-orange' : 'default'"
                    @click="setToolId(tool)"
                    block
                    class="mb-1">{{ tool }}</v-btn>
            </v-card-text>
        </v-card>

        <v-card color="teal" class="mb-4">
            <v-card-text>
                <sidemenu-texture></sidemenu-texture>
            </v-card-text>
        </v-card>

        <v-card class="mb-4">
            <v-card-text>
                <sidemenu-settings></sidemenu-settings>
            </v-card-text>
        </v-card>
    </div>
</template>
<script>
import SidemenuTexture from "./SidemenuTexture.vue";
import SidemenuSettings from "./SidemenuSettings.vue";
export default {
    components: { SidemenuTexture, SidemenuSettings },
    computed: {
        toolId() {
            return this.$store.state.toolId;
        }
    },
    data() {
        return {
            tools: ["block", "erase", "paint", "entity"]
        };
    },
    methods: {
        setToolId(tool) {
            this.$store.state.toolId = tool;
        }
    }
};
</script>