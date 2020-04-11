<template>
    <v-select label="Tool"
        @change="setTool"
        :value="toolId"
        :items="items"></v-select>
</template>
<script>
import { Tool_ID } from "../tools/Tool";
export default {
    data() {
        return {
            items: Object.values(Tool_ID)
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