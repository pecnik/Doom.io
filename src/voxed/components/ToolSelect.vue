<template>
    <v-select label="Tool"
        @change="setTool"
        :value="toolId"
        :items="items"></v-select>
</template>
<script>
import { Editor } from "../Editor";

const editor = Editor.getInstance();

export default {
    data() {
        return {
            items: editor.tools.map(tool => tool.id)
        };
    },
    computed: {
        toolId() {
            return this.$store.state.toolId;
        }
    },
    methods: {
        setTool(value) {
            this.$store.state.toolId = value;
        }
    }
};
</script>