<template>
    <div>
        <v-btn v-for="tool in tools"
            :key="tool.id"
            :color="tool.id === toolId ? 'deep-orange' : 'default'"
            @click="setToolId(tool.id)"
            block
            small
            class="mb-1">{{ tool.text }}</v-btn>
    </div>
</template>
<script>
import { editor } from "../Editor";
import { KeyCode } from "../../game/core/Input";

export default {
    computed: {
        toolId() {
            return this.$store.state.toolId;
        }
    },
    data() {
        return {
            tools: editor.tools.list.map(tool => {
                const key = KeyCode[tool.key];
                return {
                    id: tool.name,
                    text: `${tool.name} [${key}]`
                };
            })
        };
    },
    methods: {
        setToolId(tool) {
            this.$store.state.toolId = tool;
        }
    }
};
</script>