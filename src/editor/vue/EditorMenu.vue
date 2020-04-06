<template>
    <div>
        <v-btn x-large block @click="play">PLAY</v-btn>
        <br>
        <br>

        <v-select
            :value="settings.tool"
            @change="setTool"
            :items="tools"
            item-text="label"
            item-value="value"
            label="Active tool"
        ></v-select>

        <v-checkbox
            label="Wireframe"
            :input-value="settings.wireframe"
            @change="toggleWireframe"></v-checkbox>
        <v-checkbox
            label="Shading"
            :input-value="settings.shading"
            @change="toggleShading"></v-checkbox>
        <v-checkbox
            label="Debug lights"
            :input-value="settings.lightModels"
            @change="toggleLightModels"></v-checkbox>
        <v-btn  @click="newLevel">New level</v-btn>
    </div>
</template>
<script>
import { EditorTool } from "../store/EditorState";
export default {
    computed: {
        settings() {
            return {
                tool: this.$store.state.tool,
                shading: this.$store.state.shading,
                wireframe: this.$store.state.wireframe,
                lightModels: this.$store.state.lightModels
            };
        }
    },
    methods: {
        play() {
            const { level } = this.$store.state;
            localStorage.setItem("level", JSON.stringify(level));

            const url = [location.origin, location.pathname].join("");
            window.open(url);
        },
        newLevel() {
            if (!confirm("New level?")) {
                return;
            }

            const input = prompt("Resize?", "8, 4, 8");
            const parsed = input.split(",").map(x => parseInt(x));
            for (let i = 0; i < 3; i++) {
                if (isNaN(parsed[i])) {
                    alert(`Error: invalid resize value`);
                    return;
                }
            }

            const [w, h, d] = parsed;
            this.$store.dispatch("resizeLevel", [w, h, d]);
        },
        setTool(value) {
            this.$store.dispatch("setTool", value);
        },
        toggleShading(value) {
            this.$store.dispatch("setShading", value);
        },
        toggleWireframe(value) {
            this.$store.dispatch("setWireframe", value);
        },
        toggleLightModels(value) {
            this.$store.dispatch("toggleLightModels", value);
        }
    },
    data() {
        const tools = [
            {
                value: EditorTool.Block,
                label: "Block (E)"
            },
            {
                value: EditorTool.Paint,
                label: "Fill (F)"
            },
            {
                value: EditorTool.Pick,
                label: "Sample (ALT)"
            }
        ];

        return { tools };
    }
};
</script>