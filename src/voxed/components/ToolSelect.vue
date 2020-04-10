<template>
    <v-select label="Tool"
        @change="setTool"
        :value="toolId"
        :items="items"></v-select>
</template>
<script>
import { EditorTool } from "../Editor";
export default {
    data() {
        return {
            items: Object.keys(EditorTool)
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