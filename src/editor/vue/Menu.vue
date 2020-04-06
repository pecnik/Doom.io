<template>
    <div>
        <button class="form-control" @click="play">PLAY</button>

        <button class="form-control" @click="resize">Resize</button>

        <label>
            <select class="form-control" :value="$store.state.tool" @input="setTool">
                <option v-for="tool in tools" :key="tool.value" :value="tool.value">
                    {{ tool.label }}
                </option>
            </select>
        </label>

        <label class="form-control">
            <v-checkbox
                label="Wireframe"
                :input-value="settings.wireframe"
                @change="toggleWireframe"></v-checkbox>
        </label>
        <label class="form-control">
            <v-checkbox
                label="Debug lights"
                :input-value="settings.debugLights"
                @change="toggleDebugLights"></v-checkbox>
        </label>
    </div>
</template>
<script>
import { EditorTool } from "../store/EditorState";
export default {
    computed: {
        settings() {
            return {
                wireframe: this.$store.state.wireframe,
                debugLights: this.$store.state.debugLights
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
        resize() {
            if (!confirm("Resize level? Data might be lost.")) {
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
        setTool(ev) {
            this.$store.dispatch("setTool", ev.target.value);
        },
        toggleWireframe(value) {
            console.log({ value });
            this.$store.dispatch("setWireframe", value);
        },
        toggleDebugLights(value) {
            console.log({ value });
            this.$store.dispatch("setDebugLights", value);
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