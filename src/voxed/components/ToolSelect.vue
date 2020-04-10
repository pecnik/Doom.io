<template>
    <v-select label="Tool"
        @change="setTool"
        :value="tool"
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
        tool() {
            return this.$store.state.tool;
        }
    },
    methods: {
        setTool(value) {
            this.$store.state.tool = value;
        }
    }
};
</script>